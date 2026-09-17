//! Validation for the supported subset of Codex 0.154.0-alpha.6.2 server requests.
//! The pending request is the authority; WebView responses cannot add permissions.
use serde_json::{json, Value};
use std::collections::HashMap;

#[derive(Clone)]
pub(crate) struct PendingServerRequest {
    pub(crate) id: Value,
    pub(crate) workspace_id: String,
    pub(crate) token: String,
    pub(crate) method: String,
    pub(crate) params: Value,
}

pub(crate) fn request_key(id: &Value) -> Result<String, String> {
    if !id.is_string() && !id.is_i64() && !id.is_u64() {
        return Err("Invalid Codex server request ID".into());
    }
    Ok(id.to_string())
}

fn exact_keys(value: &Value, expected: &[&str]) -> bool {
    value.as_object().is_some_and(|object| {
        object.len() == expected.len() && expected.iter().all(|key| object.contains_key(*key))
    })
}

pub(crate) fn response_message(
    request: &PendingServerRequest,
    result: &Value,
) -> Result<Value, String> {
    let decision = result.get("decision");
    let valid = match request.method.as_str() {
        "item/commandExecution/requestApproval" | "item/fileChange/requestApproval" => {
            let once = decision
                .and_then(Value::as_str)
                .is_some_and(|s| matches!(s, "accept" | "decline" | "cancel"));
            let offered = request.method != "item/commandExecution/requestApproval"
                || match request.params.get("availableDecisions") {
                    Some(Value::Array(values)) => decision.is_some_and(|d| values.contains(d)),
                    None | Some(Value::Null) => true,
                    _ => false,
                };
            exact_keys(result, &["decision"]) && once && offered
        }
        "execCommandApproval" | "applyPatchApproval" => {
            exact_keys(result, &["decision"])
                && (matches!(decision.and_then(Value::as_str), Some("approved" | "abort"))
                    || decision.is_some_and(|d| {
                        exact_keys(d, &["denied"])
                            && d.get("denied").is_some_and(|denied| {
                                exact_keys(denied, &["rejection"])
                                    && denied["rejection"].is_string()
                            })
                    }))
        }
        "item/permissions/requestApproval" => {
            let requested = request.params.get("permissions").and_then(Value::as_object);
            let granted = result.get("permissions").and_then(Value::as_object);
            exact_keys(result, &["permissions", "scope"])
                && result["scope"] == "turn"
                && granted.is_some_and(|grant| {
                    grant.iter().all(|(key, value)| {
                        matches!(key.as_str(), "network" | "fileSystem")
                            && !value.is_null()
                            && requested.and_then(|p| p.get(key)) == Some(value)
                    })
                })
        }
        "mcpServer/elicitation/request" => {
            exact_keys(result, &["action", "content", "_meta"])
                && matches!(result["action"].as_str(), Some("decline" | "cancel"))
                && result["content"].is_null()
                && result["_meta"].is_null()
        }
        "item/tool/requestUserInput" => {
            exact_keys(result, &["answers"])
                && result["answers"].as_object().is_some_and(|answers| {
                    answers.iter().all(|(id, answer)| {
                        request.params["questions"]
                            .as_array()
                            .is_some_and(|questions| {
                                questions
                                    .iter()
                                    .any(|question| question["id"].as_str() == Some(id))
                            })
                            && exact_keys(answer, &["answers"])
                            && answer["answers"]
                                .as_array()
                                .is_some_and(|values| values.iter().all(Value::is_string))
                    })
                })
        }
        "item/tool/call" => {
            exact_keys(result, &["success", "contentItems"])
                && result["success"] == false
                && result["contentItems"].as_array().is_some_and(|items| {
                    items.iter().all(|item| {
                        exact_keys(item, &["type", "text"])
                            && item["type"] == "inputText"
                            && item["text"].is_string()
                    })
                })
        }
        _ => {
            if result == &json!({"_moonveilUnsupported": true}) {
                return Ok(
                    json!({"id": request.id, "error": {"code": -32601, "message": "This Codex server request is not supported by Moonveil; rejected by the user."}}),
                );
            }
            false
        }
    };
    if !valid {
        return Err(format!(
            "Unsupported response for Codex request {}",
            request.method
        ));
    }
    Ok(json!({"id": request.id, "result": result}))
}

/// Consume the request atomically before IO so duplicate/replayed WebView replies fail closed.
pub(crate) fn take_response(
    pending: &mut HashMap<String, PendingServerRequest>,
    workspace_id: &str,
    id: &Value,
    result: &Value,
) -> Result<Value, String> {
    let key = request_key(id)?;
    let request = pending
        .get(&key)
        .ok_or("Codex request is no longer pending")?;
    if request.workspace_id != workspace_id {
        return Err("Codex request belongs to another workspace".into());
    }
    if result.get("_moonveilRequestToken").and_then(Value::as_str) != Some(request.token.as_str()) {
        return Err("Codex request belongs to a different session or request generation".into());
    }
    let mut result = result.clone();
    result
        .as_object_mut()
        .ok_or("Invalid response")?
        .remove("_moonveilRequestToken");
    let message = response_message(request, &result)?;
    pending.remove(&key);
    Ok(message)
}

#[cfg(test)]
mod tests {
    use super::*;
    fn request(method: &str, params: Value) -> PendingServerRequest {
        PendingServerRequest {
            id: json!("001"),
            workspace_id: "workspace".into(),
            token: "session:request".into(),
            method: method.into(),
            params,
        }
    }
    #[test]
    fn preserves_ids_and_distinguishes_string_from_number() {
        assert_ne!(
            request_key(&json!(1)).unwrap(),
            request_key(&json!("1")).unwrap()
        );
        assert!(request_key(&Value::Null).is_err());
        assert_eq!(
            response_message(
                &request("item/fileChange/requestApproval", json!({})),
                &json!({"decision":"accept"})
            )
            .unwrap()["id"],
            "001"
        );
    }
    #[test]
    fn command_decisions_are_constrained_by_server_and_cannot_persist_rules() {
        let req = request(
            "item/commandExecution/requestApproval",
            json!({"availableDecisions":["decline","cancel"]}),
        );
        assert!(response_message(&req, &json!({"decision":"accept"})).is_err());
        assert!(response_message(&req, &json!({"decision":"decline"})).is_ok());
        assert!(response_message(&req, &json!({"decision":"acceptForSession"})).is_err());
        assert!(response_message(
            &req,
            &json!({"decision":{"acceptWithExecpolicyAmendment":{"execpolicy_amendment":["cmd"]}}})
        )
        .is_err());
    }
    #[test]
    fn permissions_are_scoped_and_cannot_be_broadened() {
        let req = request(
            "item/permissions/requestApproval",
            json!({"permissions":{"network":{"enabled":true},"fileSystem":null}}),
        );
        assert!(response_message(&req, &json!({"permissions":{},"scope":"turn"})).is_ok());
        assert!(response_message(
            &req,
            &json!({"permissions":{"network":{"enabled":true}},"scope":"turn"})
        )
        .is_ok());
        assert!(response_message(
            &req,
            &json!({"permissions":{"fileSystem":{"write":["/"]}},"scope":"turn"})
        )
        .is_err());
        assert!(response_message(&req, &json!({"permissions":{},"scope":"session"})).is_err());
        assert!(response_message(&req, &json!({"decision":"accept"})).is_err());
    }
    #[test]
    fn legacy_mcp_and_unknown_requests_use_distinct_contracts() {
        assert!(response_message(
            &request("execCommandApproval", json!({})),
            &json!({"decision":"approved"})
        )
        .is_ok());
        assert!(response_message(
            &request("execCommandApproval", json!({})),
            &json!({"decision":"accept"})
        )
        .is_err());
        assert!(response_message(
            &request("mcpServer/elicitation/request", json!({})),
            &json!({"action":"cancel","content":null,"_meta":null})
        )
        .is_ok());
        let unknown = request("new/security/request", json!({}));
        assert!(response_message(&unknown, &json!({"decision":"accept"})).is_err());
        assert_eq!(
            response_message(&unknown, &json!({"_moonveilUnsupported":true})).unwrap()["error"]
                ["code"],
            -32601
        );
    }
    #[test]
    fn replies_require_workspace_ownership_and_can_only_be_consumed_once() {
        let req = request("item/fileChange/requestApproval", json!({}));
        let mut pending = HashMap::from([(request_key(&req.id).unwrap(), req.clone())]);
        assert!(take_response(
            &mut pending,
            "other",
            &req.id,
            &json!({"decision":"accept","_moonveilRequestToken":"session:request"})
        )
        .is_err());
        assert_eq!(pending.len(), 1);
        assert!(take_response(
            &mut pending,
            "workspace",
            &req.id,
            &json!({"decision":"accept","_moonveilRequestToken":"old-session"})
        )
        .is_err());
        assert!(take_response(
            &mut pending,
            "workspace",
            &req.id,
            &json!({"decision":"acceptForSession","_moonveilRequestToken":"session:request"})
        )
        .is_err());
        assert_eq!(pending.len(), 1);
        assert!(take_response(
            &mut pending,
            "workspace",
            &req.id,
            &json!({"decision":"accept","_moonveilRequestToken":"old-session"})
        )
        .is_err());
        assert!(take_response(
            &mut pending,
            "workspace",
            &req.id,
            &json!({"decision":"accept","_moonveilRequestToken":"session:request"})
        )
        .is_ok());
        assert!(take_response(
            &mut pending,
            "workspace",
            &req.id,
            &json!({"decision":"accept","_moonveilRequestToken":"session:request"})
        )
        .is_err());
    }
}
