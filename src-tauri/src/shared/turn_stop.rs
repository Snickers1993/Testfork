//! Stop only the native Codex terminals demonstrably owned by the interrupted turn.
use serde_json::{json, Value};
use std::collections::{HashMap, HashSet};
use std::future::Future;
use std::time::Duration;
use tokio::sync::Mutex;

#[derive(Clone, Default)]
pub(crate) struct CommandTurnRegistry {
    owners: HashMap<(String, String), String>,
    exited_items: HashSet<(String, String)>,
    completed: HashSet<(String, String)>,
    stopping_threads: HashSet<String>,
}

impl CommandTurnRegistry {
    pub(crate) fn observe(&mut self, message: &Value) -> bool {
        let Some(params) = message.get("params") else {
            return false;
        };
        let Some(thread_id) = params
            .get("threadId")
            .or_else(|| params.get("thread_id"))
            .and_then(Value::as_str)
        else {
            return false;
        };
        let method = message.get("method").and_then(Value::as_str);
        if matches!(method, Some("item/started" | "item/completed")) {
            let turn_id = params
                .get("turnId")
                .or_else(|| params.get("turn_id"))
                .and_then(Value::as_str);
            let item = &params["item"];
            if let (Some(turn_id), Some(item_id), Some("commandExecution")) =
                (turn_id, item["id"].as_str(), item["type"].as_str())
            {
                let key = (thread_id.into(), item_id.into());
                self.owners.insert(key.clone(), turn_id.into());
                // A yielded tool call can have a live process; completion alone is insufficient.
                if method == Some("item/completed")
                    && (item["exitCode"].is_i64()
                        || (item["status"] == "declined"
                            && item.get("processId") == Some(&Value::Null)))
                {
                    self.exited_items.insert(key);
                }
                return true;
            }
        }
        if method == Some("turn/completed") {
            if let Some(turn_id) = params
                .pointer("/turn/id")
                .or_else(|| params.get("turnId"))
                .and_then(Value::as_str)
            {
                self.completed.insert((thread_id.into(), turn_id.into()));
                return true;
            }
        }
        false
    }

    pub(crate) fn is_completed(&self, thread_id: &str, turn_id: &str) -> bool {
        self.completed.contains(&(thread_id.into(), turn_id.into()))
    }

    pub(crate) fn begin_stop(&mut self, thread_id: &str) -> Result<(), String> {
        if !self.stopping_threads.insert(thread_id.into()) {
            return Err("Stop is already in progress for this thread".into());
        }
        Ok(())
    }

    pub(crate) fn end_stop(&mut self, thread_id: &str) {
        self.stopping_threads.remove(thread_id);
    }

    pub(crate) fn check_request(&self, method: &str, params: &Value) -> Result<(), String> {
        if matches!(
            method,
            "turn/start" | "turn/steer" | "review/start" | "thread/shellCommand"
        ) && params
            .get("threadId")
            .and_then(Value::as_str)
            .is_some_and(|id| self.stopping_threads.contains(id))
        {
            return Err("Wait for Stop to finish before starting more work in this thread".into());
        }
        Ok(())
    }

    fn owns(&self, thread_id: &str, item_id: &str, turn_id: &str) -> bool {
        self.owners
            .get(&(thread_id.into(), item_id.into()))
            .is_some_and(|owner| owner == turn_id)
    }

    fn unresolved(&self, thread_id: &str, turn_id: &str, stopped: &HashSet<String>) -> bool {
        self.owners.iter().any(|((thread, item), owner)| {
            thread == thread_id
                && owner == turn_id
                && !stopped.contains(item)
                && !self.exited_items.contains(&(thread.clone(), item.clone()))
        })
    }
}

pub(crate) fn rpc_result(response: Value, method: &str) -> Result<Value, String> {
    if let Some(error) = response.get("error") {
        return Err(format!(
            "{method}: {}",
            error
                .get("message")
                .and_then(Value::as_str)
                .unwrap_or("Codex returned an error")
        ));
    }
    response
        .get("result")
        .cloned()
        .ok_or_else(|| format!("{method}: missing Codex result"))
}

#[derive(Clone, PartialEq, Eq, Hash)]
struct Terminal {
    item_id: String,
    process_id: String,
}

async fn list_terminals<F, Fut>(thread_id: &str, send: &mut F) -> Result<Vec<Terminal>, String>
where
    F: FnMut(&'static str, Value) -> Fut,
    Fut: Future<Output = Result<Value, String>>,
{
    let mut terminals = HashSet::new();
    let mut cursor: Option<String> = None;
    let mut seen = HashSet::new();
    loop {
        let result = rpc_result(
            send(
                "thread/backgroundTerminals/list",
                json!({"threadId":thread_id,"cursor":cursor,"limit":100}),
            )
            .await?,
            "thread/backgroundTerminals/list",
        )?;
        let entries = result
            .get("data")
            .and_then(Value::as_array)
            .ok_or("Codex terminal list omitted data")?;
        for entry in entries {
            let item_id = entry
                .get("itemId")
                .and_then(Value::as_str)
                .filter(|s| !s.is_empty())
                .ok_or("Codex terminal omitted its native item ID")?;
            let process_id = entry
                .get("processId")
                .and_then(Value::as_str)
                .filter(|s| !s.is_empty())
                .ok_or("Codex terminal omitted its native process ID")?;
            terminals.insert(Terminal {
                item_id: item_id.into(),
                process_id: process_id.into(),
            });
        }
        cursor = match result.get("nextCursor") {
            None | Some(Value::Null) => None,
            Some(Value::String(value)) if !value.is_empty() => Some(value.clone()),
            _ => return Err("Codex terminal list returned an invalid cursor".into()),
        };
        let Some(ref next) = cursor else {
            return Ok(terminals.into_iter().collect());
        };
        if !seen.insert(next.clone()) {
            return Err("Codex terminal list repeated a cursor".into());
        }
    }
}

/// Uses Codex's termination API, never host OS PIDs. Reconciliation confirms native
/// bookkeeping; independent OS-exit evidence still belongs to native runtime validation.
pub(crate) async fn stop_owned_terminals<F, Fut>(
    thread_id: &str,
    turn_id: &str,
    registry: &Mutex<CommandTurnRegistry>,
    mut send: F,
) -> Result<usize, String>
where
    F: FnMut(&'static str, Value) -> Fut,
    Fut: Future<Output = Result<Value, String>>,
{
    let mut stopped = HashSet::new();
    let mut clean_scans = 0;
    // Item begin can precede native process registration. Re-read the live ledger and
    // full list after every action; never infer exit from an initially empty list.
    for _ in 0..20 {
        let terminals = list_terminals(thread_id, &mut send).await?;
        let state = registry.lock().await.clone();
        let targets: Vec<_> = terminals
            .iter()
            .filter(|terminal| state.owns(thread_id, &terminal.item_id, turn_id))
            .cloned()
            .collect();
        if targets
            .iter()
            .any(|terminal| stopped.contains(&terminal.item_id))
        {
            return Err("Codex still reports a running terminal after termination".into());
        }
        for target in &targets {
            // Native process IDs may be reused. Refresh both IDs immediately before
            // termination, and preserve a changed identity instead of killing it.
            let fresh = list_terminals(thread_id, &mut send).await?;
            if fresh.iter().any(|terminal| {
                terminal.process_id == target.process_id && terminal.item_id != target.item_id
            }) {
                return Err(
                    "Native terminal identity changed during Stop; process stop is unconfirmed"
                        .into(),
                );
            }
            if !fresh.contains(target) {
                continue;
            }
            if !registry
                .lock()
                .await
                .owns(thread_id, &target.item_id, turn_id)
            {
                return Err("Native terminal ownership changed during Stop".into());
            }
            let result = rpc_result(
                send(
                    "thread/backgroundTerminals/terminate",
                    json!({"threadId":thread_id,"processId":target.process_id}),
                )
                .await?,
                "thread/backgroundTerminals/terminate",
            )?;
            if !result.get("terminated").is_some_and(Value::is_boolean) {
                return Err("Codex did not acknowledge native terminal termination".into());
            }
            // false can mean an exit raced the request; subsequent full scans must
            // still establish absence before reporting native confirmation.
            stopped.insert(target.item_id.clone());
        }
        if targets.is_empty() {
            let latest = registry.lock().await;
            if terminals.iter().any(|terminal| {
                !latest
                    .owners
                    .contains_key(&(thread_id.into(), terminal.item_id.clone()))
            }) {
                return Err("Some native terminals have unknown turn ownership; they were preserved and process stop could not be confirmed".into());
            }
            if !latest.unresolved(thread_id, turn_id, &stopped) {
                clean_scans += 1;
                if clean_scans >= 2 {
                    return Ok(stopped.len());
                }
            } else {
                clean_scans = 0
            }
        } else {
            clean_scans = 0
        }
        tokio::time::sleep(Duration::from_millis(100)).await;
    }
    Err("Codex has not accounted for every command started by the interrupted turn; a process may still be registering or running".into())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::VecDeque;
    use std::sync::{Arc, Mutex as StdMutex};
    fn registry() -> CommandTurnRegistry {
        let mut registry = CommandTurnRegistry::default();
        for (item, turn) in [("own", "stop"), ("prior", "previous")] {
            registry.observe(&json!({"method":"item/started","params":{"threadId":"t","turnId":turn,"item":{"id":item,"type":"commandExecution"}}}));
        }
        registry
    }
    async fn run(replies: Vec<Value>) -> (Result<usize, String>, Vec<(String, Value)>) {
        let calls = Arc::new(StdMutex::new(Vec::new()));
        let captured = calls.clone();
        let replies = Arc::new(StdMutex::new(VecDeque::from(replies)));
        let result = stop_owned_terminals(
            "t",
            "stop",
            &Mutex::new(registry()),
            move |method, params| {
                captured.lock().unwrap().push((method.into(), params));
                std::future::ready(Ok(replies
                    .lock()
                    .unwrap()
                    .pop_front()
                    .expect("unexpected request")))
            },
        )
        .await;
        let calls = calls.lock().unwrap().clone();
        (result, calls)
    }
    fn list(data: Value) -> Value {
        json!({"result":{"data":data,"nextCursor":null}})
    }
    fn own() -> Value {
        json!({"itemId":"own","processId":"100"})
    }
    #[test]
    fn terminates_only_owned_process_once_and_verifies_absence() {
        tokio::runtime::Builder::new_current_thread()
            .enable_time()
            .build()
            .unwrap()
            .block_on(async {
                let prior = json!({"itemId":"prior","processId":"200"});
                let (result, calls) = run(vec![
                    list(json!([own(), own(), prior])),
                    list(json!([own(), prior])),
                    json!({"result":{"terminated":true}}),
                    list(json!([prior])),
                    list(json!([prior])),
                ])
                .await;
                assert_eq!(result.unwrap(), 1);
                let terminations: Vec<_> = calls
                    .iter()
                    .filter(|(m, _)| m.ends_with("/terminate"))
                    .collect();
                assert_eq!(terminations.len(), 1);
                assert_eq!(terminations[0].1, json!({"threadId":"t","processId":"100"}));
            });
    }
    #[test]
    fn preserves_unknown_ownership_and_reports_uncertainty() {
        tokio::runtime::Builder::new_current_thread()
            .enable_time()
            .build()
            .unwrap()
            .block_on(async {
                let (result, calls) =
                    run(vec![list(json!([{"itemId":"unknown","processId":"300"}]))]).await;
                assert!(result.unwrap_err().contains("unknown turn ownership"));
                assert!(calls.iter().all(|(m, _)| m.ends_with("/list")));
            });
    }
    #[test]
    fn propagates_native_errors_and_checks_acknowledged_process_absence() {
        tokio::runtime::Builder::new_current_thread()
            .enable_time()
            .build()
            .unwrap()
            .block_on(async {
                let (error, _) = run(vec![
                    list(json!([own()])),
                    list(json!([own()])),
                    json!({"error":{"message":"termination failed"}}),
                ])
                .await;
                assert!(error.unwrap_err().contains("termination failed"));
                let (still_running, _) = run(vec![
                    list(json!([own()])),
                    list(json!([own()])),
                    json!({"result":{"terminated":true}}),
                    list(json!([own()])),
                ])
                .await;
                assert!(still_running.unwrap_err().contains("still reports"));
            });
    }
    #[test]
    fn accepts_exit_race_only_after_repeated_absence() {
        tokio::runtime::Builder::new_current_thread()
            .enable_time()
            .build()
            .unwrap()
            .block_on(async {
                let (result, _) = run(vec![
                    list(json!([own()])),
                    list(json!([own()])),
                    json!({"result":{"terminated":false}}),
                    list(json!([])),
                    list(json!([])),
                ])
                .await;
                assert_eq!(result.unwrap(), 1);
            });
    }
    #[test]
    fn waits_for_initial_registration_instead_of_confirming_empty_list() {
        tokio::runtime::Builder::new_current_thread()
            .enable_time()
            .build()
            .unwrap()
            .block_on(async {
                let (result, calls) = run(vec![
                    list(json!([])),
                    list(json!([own()])),
                    list(json!([own()])),
                    json!({"result":{"terminated":true}}),
                    list(json!([])),
                    list(json!([])),
                ])
                .await;
                assert_eq!(result.unwrap(), 1);
                assert_eq!(calls.len(), 6);
            });
    }
    #[test]
    fn fails_closed_when_started_command_never_registers_or_exits() {
        tokio::runtime::Builder::new_current_thread()
            .enable_time()
            .build()
            .unwrap()
            .block_on(async {
                let (result, _) = run(vec![list(json!([])); 20]).await;
                assert!(result.unwrap_err().contains("not accounted"));
            });
    }
    #[test]
    fn never_terminates_reused_process_identity() {
        tokio::runtime::Builder::new_current_thread()
            .enable_time()
            .build()
            .unwrap()
            .block_on(async {
                let (result, calls) = run(vec![
                    list(json!([own()])),
                    list(json!([{"itemId":"prior","processId":"100"}])),
                ])
                .await;
                assert!(result.unwrap_err().contains("identity changed"));
                assert!(calls.iter().all(|(m, _)| m.ends_with("/list")));
            });
    }
    #[test]
    fn completion_without_exit_code_is_not_process_exit() {
        let mut state = registry();
        state.observe(&json!({"method":"item/completed","params":{"threadId":"t","turnId":"stop","item":{"id":"own","type":"commandExecution","status":"completed","exitCode":null}}}));
        assert!(state.unresolved("t", "stop", &HashSet::new()));
        state.observe(&json!({"method":"item/completed","params":{"threadId":"t","turnId":"stop","item":{"id":"own","type":"commandExecution","status":"completed","exitCode":0}}}));
        assert!(!state.unresolved("t", "stop", &HashSet::new()));
        assert!(state.owns("t", "own", "stop"));
    }
    #[test]
    fn blocks_new_work_only_in_stopping_thread_and_rejects_duplicate_stop() {
        let mut state = registry();
        state.begin_stop("t").unwrap();
        assert!(state.begin_stop("t").is_err());
        for method in [
            "turn/start",
            "turn/steer",
            "review/start",
            "thread/shellCommand",
        ] {
            assert!(state
                .check_request(method, &json!({"threadId":"t"}))
                .is_err());
            assert!(state
                .check_request(method, &json!({"threadId":"other"}))
                .is_ok());
        }
        assert!(state
            .check_request("thread/backgroundTerminals/list", &json!({"threadId":"t"}))
            .is_ok());
        state.end_stop("t");
        assert!(state
            .check_request("turn/start", &json!({"threadId":"t"}))
            .is_ok());
    }
    #[test]
    fn observes_late_owned_items_after_first_empty_scan() {
        tokio::runtime::Builder::new_current_thread().enable_time().build().unwrap().block_on(async {
            let registry = Arc::new(Mutex::new(CommandTurnRegistry::default()));
            let replies = Arc::new(StdMutex::new(VecDeque::from(vec![
                list(json!([])), list(json!([own()])), list(json!([own()])),
                json!({"result":{"terminated":true}}), list(json!([])), list(json!([])),
            ])));
            let mut count = 0;
            let captured_registry = registry.clone();
            let result = stop_owned_terminals("t", "stop", &registry, move |_method, _params| {
                count += 1;
                let register_late_item = count == 2;
                let registry = captured_registry.clone();
                let reply = replies.lock().unwrap().pop_front().expect("unexpected request");
                async move {
                    if register_late_item {
                        registry.lock().await.observe(&json!({"method":"item/started","params":{"threadId":"t","turnId":"stop","item":{"id":"own","type":"commandExecution"}}}));
                    }
                    Ok(reply)
                }
            }).await;
            assert_eq!(result.unwrap(), 1);
        });
    }

    #[test]
    fn reads_every_page_and_rejects_repeated_cursor() {
        tokio::runtime::Builder::new_current_thread().enable_time().build().unwrap().block_on(async {
            let mut replies = VecDeque::from(vec![
                json!({"result":{"data":[{"itemId":"prior","processId":"2"}],"nextCursor":"next"}}),
                list(json!([own()])),
            ]);
            let terminals = list_terminals("t", &mut |_method, _params| std::future::ready(Ok(replies.pop_front().unwrap()))).await.unwrap();
            assert_eq!(terminals.len(), 2);
            let mut replies = VecDeque::from(vec![json!({"result":{"data":[],"nextCursor":"loop"}});2]);
            let result = list_terminals("t", &mut |_method, _params| std::future::ready(Ok(replies.pop_front().unwrap()))).await;
            assert!(result.err().unwrap().contains("repeated a cursor"));
        });
    }
}
