/* MOONVALE • illuminated edition, 0.2
   Original, resolution-independent character and environment illustrations.
   No remote images, font files, tracking, or externally loaded assets. */
let serial=0;
const PAL={scholar:['#c5b7ef','#71619a','#342e58','#eee5ff'],knight:['#deb992','#87717d','#30394d','#fae3b7'],fairy:['#efb4d2','#af739e','#583d70','#ffe6ee'],ranger:['#c1d3a2','#708769','#2e514e','#ecedc0'],owl:['#c1dceb','#738cad','#304763','#eaf7fa']};
const S=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const line=(d,c='#dfca9b',w=1,extra='')=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const star=(x,y,s=4,c='#f3dfa7')=>`<path d="M${x} ${y-s}Q${x+1} ${y-1} ${x+s} ${y}Q${x+1} ${y+1} ${x} ${y+s}Q${x-1} ${y+1} ${x-s} ${y}Q${x-1} ${y-1} ${x} ${y-s}" fill="${c}"/>`;
const ellipse=(x,y,rx,ry,c,extra='')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" ${extra}/>`;
const circ=(x,y,r,c,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" ${extra}/>`;
function runeTrim(d,color='#dcc999'){return line(d,color,1.05,'stroke-dasharray="1 4"')}
function gem(x,y,s=5,color='#b7deda'){return S(`M${x} ${y-s}l${s*.65} ${s}l-${s*.65} ${s}l-${s*.65}-${s}Z`,color)+line(`M${x} ${y-s}v${s*2}m-${s*.65}-${s}h${s*1.3}`,'#ffffff77',.6)}
function leaf(x,y,a,s,c){return `<path d="M0 0Q-${s} -${s*.7} 0 -${s*2}Q${s*.8} -${s*.75} 0 0" fill="${c}" transform="translate(${x} ${y}) rotate(${a})"/>`}
function eyes(y=85,spread=17,color='#7779a8'){
 return `<g class="character-eyes">${[-1,1].map(s=>{let x=100+s*spread;return ellipse(x,y,6.2,8.3,'#fcf5e6')+ellipse(x+.5,y+1,4.7,6.9,color)+ellipse(x+.5,y+2,2.3,5,'#253143')+circ(x+1.8,y-2,1.7,'#fff')+circ(x-1,y+4,.7,'#eff8fd')+line(`M${x-6} ${y-5}Q${x} ${y-10} ${x+6} ${y-5}`,'#414054',1.6)}).join('')}</g>`;
}
function face(){return ellipse(100,81,30,32,'url(#$skin)')+ellipse(77,96,6,2.8,'#d7969680')+ellipse(123,96,6,2.8,'#d7969680')+line('M98 95q-1 3 3 3','#ba8d83',.8)+line('M95 104q6 4 11-1','#936d74',1.2)}
function character(kind){
 const [light,mid,dark,shine]=PAL[kind]||PAL.scholar;let art='';
 if(kind==='scholar'){
 art+=S('M70 71Q50 112 64 168l29-10V65M126 73q29 38 7 92l-21-10V68','url(#$hair)')+line('M66 97q-8 35 7 54m54-52q13 28-4 49','#aca7c5',1.3);
 art+=S('M71 117Q53 126 41 192Q80 220 103 207Q130 225 153 192L129 118Z','url(#$cape)',`stroke="${dark}" stroke-width="2"`);
 art+=S('M83 119L74 189L95 210L119 197L117 119Z','url(#$robe)')+line('M78 178q20 10 45-1',light,2)+line('M74 187q22 14 48 6',light,1.3)+runeTrim('M48 189q10-36 25-62m63 61q-3-34-12-54');
 art+=S('M82 123L99 148L118 124L109 157L96 163L86 143Z',dark)+line('M83 124l16 23 18-23',shine,1.5)+gem(99,146,6,'#cbd8e6');
 art+=S('M83 204L81 221Q73 227 70 221l7-17Z','#554b65')+S('M114 204l9 14q1 6-10 4l-7-18Z','#554b65');
 art+=face()+eyes(85,16,'#8784b8');
 art+=S('M69 71Q69 39 100 45Q135 47 131 79L119 63Q109 76 107 64L102 52Q88 81 90 60L81 79Z','url(#$hair)')+line('M81 61q10-17 20-12m18 4q9 9 10 17','#f4eef5',1.3);
 art+=S('M69 68Q74 30 107 14Q94 34 120 40L135 69Z','url(#$hat)',`stroke="${dark}" stroke-width="1.7"`)+S('M71 59Q98 54 129 58l6 11-68 6Z',light)+line('M74 61q23-5 53 0',shine,1)+S('M48 72Q92 57 150 67Q157 76 143 81Q97 89 53 80Z','url(#$hat)',`stroke="${dark}" stroke-width="1.7"`)+line('M52 74q42-8 93-3',light,1.4);
 art+=S('M104 32a9 9 0 1 0 6 15a7 7 0 0 1-6-15',shine)+star(121,46,3)+runeTrim('M75 54q6-13 17-19',shine)+gem(73,69,3.5,'#e8ca94');
 art+=line('M154 204l10-143','#846d58',5)+line('M155 204l10-137','#d4c4a0',1.4)+S('M162 40L175 57L163 79L153 58Z','url(#$crystal)',`stroke="#b8b8de" stroke-width="1.5"`)+line('M162 42l1 35m-9-19h19','#e4efff88',1.1)+line('M156 77q8 5 14-1m-14 4q8 5 13 0',shine,2)+circ(163,58,27,'url(#$aura)')+star(184,43,4)+star(147,41,2);
 art+=S('M49 142L82 136L113 151L108 183L76 172L47 177Z','#9d776f',`stroke="#453e51" stroke-width="1.5"`)+S('M51 139L82 134L111 147L106 177L78 168L50 173Z','url(#$paper)')+line('M82 135l-4 32','#b69b7a',1.5)+line('M55 145l20-3m-21 9l17-3m-17 10l18-4m13-10l18 7m-19 0l16 6m-17 0l14 5','#b1977c',.8)+S('M71 171l-1 17 8-5 4 4-1-14Z','#b089a9');
 art+=ellipse(49,156,7.5,10,'url(#$skin)','transform="rotate(-12 49 156)"')+ellipse(109,164,7.2,9.5,'url(#$skin)','transform="rotate(20 109 164)"');
 }
 if(kind==='knight'){
 art+=S('M136 177Q179 146 186 172Q191 202 153 203Q165 190 156 181Q171 188 176 178Q180 169 166 174L143 187Z','url(#$fur)',`stroke="#434551" stroke-width="1.7"`)+line('M155 199q23-1 28-17','#dfd6cc',1.2);
 art+=S('M66 115L40 193L65 204L96 155L128 208L156 193L129 114Z','url(#$cape)',`stroke="#35303e" stroke-width="2"`)+runeTrim('M47 191L68 127M131 134l17 54',light);
 art+=S('M75 121L60 148L77 183L125 182L140 144L126 120Z','url(#$metal)',`stroke="#293846" stroke-width="2"`)+S('M76 127L99 141L124 128L119 165L101 179L80 165Z','#4e6176')+S('M100 141L121 131L116 162L101 171Z','#718393')+line('M75 126L99 140L126 126M100 140v36',light,2)+line('M80 154q19 11 39 0',light,1)+gem(100,146,7,'#f1cf8d')+runeTrim('M83 160l16 12 15-12',shine);
 art+=S('M69 119L47 125L40 144L60 154L80 134Z','url(#$metal)',`stroke="#344453" stroke-width="2"`)+S('M127 118L148 122L161 141L140 153L120 135Z','url(#$metal)',`stroke="#344453" stroke-width="2"`)+line('M47 141L59 147L74 133M128 131l14 16 12-6',light,2);
 art+=S('M75 179L69 215L83 220L99 187L116 220L133 214L125 180Z','#35495b')+S('M72 195L88 199L80 220L64 220Z','url(#$metal)')+S('M113 198l15-5 10 24-20 4Z','url(#$metal)')+line('M72 200l11 3M117 204l11-4',light,2);
 art+=S('M67 65L55 21L85 47M115 45L145 20L134 75Z','url(#$fur)',`stroke="#424753" stroke-width="1.8"`)+S('M62 31L69 56L79 50Z','#d5b4b5')+S('M137 31L121 51L132 58Z','#d5b4b5');
 art+=ellipse(101,78,37,35,'url(#$fur)')+S('M64 84L82 88L98 104L118 87L139 82Q132 115 101 115Q75 114 64 84Z','#e2dcd6')+eyes(81,18,'#c7b784')+S('M68 63Q68 43 95 44Q133 37 136 67L124 57L112 71L110 55L97 68L92 52L77 67Z','#68798a')+line('M78 54l13-4m9-2l10 3m7 0l12 7','#b4c0c9',1.5);
 art+=S('M96 94h10l-5 5Z','#9c7c85')+line('M91 103q6 2 10-2q6 4 11-1','#716276',1)+line('M75 94l-17-3m18 8-17 2m67-8 17-4m-17 11 17 1','#adb2b9',.8)+S('M91 43l8-9 9 8-7 9Z',light)+gem(100,44,4,'#a8cbda');
 art+=S('M40 151L47 150L43 201L33 228L26 222L34 199Z','url(#$blade)',`stroke="#8d99a6" stroke-width="1.2"`)+line('M38 160l-7 58','#f1f3e6',1.4)+line('M25 161l27 4',light,4)+line('M39 145l-2 17','#7b6657',5)+ellipse(46,153,6.5,10,'#91a1b0');
 art+=line('M148 152l7 26','#99a8b3',12)+line('M149 158l4 11',light,1.5)+circ(156,181,6,'#8899a7');
 }
 if(kind==='fairy'){
 art+=`<g class="sprite-wings">${S('M76 132Q14 31 25 101Q20 132 58 155Q10 138 40 178Q72 186 83 153Z','url(#$wing)','stroke="#e3d2f0" stroke-width="1.1"')}${S('M122 133Q184 33 178 100Q178 133 144 151Q193 131 164 174Q131 188 117 151Z','url(#$wing)','stroke="#d3e7ed" stroke-width="1.1"')}${line('M28 78q1 43 46 66M35 105l35 23M50 173l25-22m93-72q1 43-45 66m39-42-30 25m27 43-25-20','#f9f3e1aa',.7)}</g>`;
 art+=S('M70 106Q47 143 62 172L81 151L119 158L143 165Q153 121 127 103Z','url(#$hair)')+S('M73 121L54 174L77 194L99 183L124 197L147 174L126 119Z','url(#$cape)',`stroke="#724c74" stroke-width="1.5"`)+S('M84 126L73 172L99 189L124 171L114 126Z','url(#$robe)')+line('M78 126L99 153L120 126M69 173L99 181L133 173',shine,1.8)+runeTrim('M61 170l14-34M129 136l11 33',shine)+gem(99,146,6,'#d8ddae');
 art+=S('M85 189L79 214L86 221L96 194M107 191l10 26 8 2-6-26Z','url(#$skin)')+S('M78 211q7 4 10 1l2 13-16-2Z','#a98aac')+S('M116 213l8-3 7 12-14 1Z','#a98aac');
 art+=face()+eyes(85,16,'#7f9e91')+S('M70 75Q62 44 92 43Q129 33 133 70L122 76L117 52L102 72L103 51L85 78L85 57Z','url(#$hair)')+S('M75 80L55 67L67 94M130 80l15-15-11 29Z','url(#$skin)')+line('M70 86l-9-11m70 11 7-12','#cdad9b',.8);
 art+=line('M69 61Q100 44 130 61','#86a68f',2)+[-28,-13,2,18,30].map((d,i)=>leaf(100+d,55+Math.abs(d)/6,d<0?-55:55,4,'#a8c6a7')+circ(100+d,52+Math.abs(d)/6,i%2?3:4,'#f6d9ba')).join('')+gem(101,57,4,'#f4deb1');
 art+=line('M61 143l-12 19','#f2d8bc',9)+line('M133 143l16 13','#f2d8bc',9)+circ(150,156,5,'url(#$skin)')+line('M148 160l18-44','#c9ba8b',2.7)+star(167,107,12,'#f3e6bb')+circ(168,108,28,'url(#$aura)')+star(152,92,4)+star(182,122,4);
 art+=S('M74 163Q92 171 123 162L121 171Q95 180 78 172Z','#d7b7c7')+line('M88 170q-10 13-18 10m39-11q9 15 20 8','#e9d8d5',1.1);
 }
 if(kind==='ranger'){
 art+=S('M131 165Q172 133 189 156Q204 187 159 204L123 191Q158 176 163 167Q142 170 132 180Z','url(#$fox)',`stroke="#825e51" stroke-width="1.7"`)+S('M180 149Q204 169 178 194L156 201L145 191L156 175L171 167Z','#f3e1bd')+line('M161 196l19-16','#d1b893',1);
 art+=S('M69 114L43 182L70 195L89 180L111 201L151 181L129 112Z','url(#$cape)',`stroke="#284543" stroke-width="2"`)+S('M80 117L72 174L101 190L126 175L115 117Z','#799184')+line('M67 125l33 27 29-28',light,2)+runeTrim('M51 179l21-52m62 12 8 38',shine)+S('M66 157l68 5-3 8-65-5Z','#675748')+gem(101,165,4,shine);
 art+=S('M76 187l-5 28 15 7 12-31 18 27 14-5-6-26Z','#586259')+S('M70 209l15 4-1 13-22-1Z','#655748')+S('M115 210l13-2 10 16-21 3Z','#655748')+line('M71 214l11 3m37-1 10-2',light,1.4);
 art+=S('M67 62L52 19L85 42M115 45l31-29-11 51Z','url(#$fox)',`stroke="#986e54" stroke-width="1.5"`)+S('M59 31L68 56L80 48Z','#ead2ba')+S('M138 28L119 48L133 55Z','#ead2ba');
 art+=ellipse(101,80,37,34,'url(#$fox)')+S('M64 84L81 84L100 103L119 84L138 82Q136 114 101 116Q69 115 64 84Z','#f1e5c9')+eyes(80,19,'#8caa88')+S('M96 92h11l-6 7Z','#5c5149')+line('M91 105q6 2 10-3q5 4 11-1','#a08c76',1)+line('M69 97l-14-2m16 8-14 1m73-7 16-2m-16 7 15 1','#bb9978',.8);
 art+=S('M54 63L83 33L113 38L139 66Z','url(#$hat)',`stroke="#324b42" stroke-width="1.8"`)+S('M49 65Q104 48 147 65L143 73Q93 65 53 75Z',mid,`stroke="#344e47" stroke-width="1.7"`)+line('M59 65Q100 56 134 65',light,2.2)+S('M116 44Q112 7 145 13Q153 29 116 44Z','#d9ca9c')+line('M118 42L137 18','#9d996f',1)+line('M121 34l6-14m-2 10 12-4','#b1ae84',.9);
 art+=S('M51 145L80 140L112 151L107 181L78 172L51 181Z','url(#$paper)',`stroke="#b7a17b" stroke-width="1.2"`)+line('M79 141l-1 32','#b3a683',1)+line('M57 154l12-6 14 14 14-8 10 12','#7f9d8a',1.1,'stroke-dasharray="2 3"')+circ(99,160,3,'none','stroke="#b78c69" stroke-width="1.2"')+ellipse(52,161,7.5,10,'url(#$fox)')+ellipse(110,167,7,10,'url(#$fox)');
 art+=line('M145 128q30 40 5 80','#ab9876',2)+line('M148 129l2 76','#d6c6a1',.7)+line('M143 177l22-42','#aaa284',1.8)+S('M165 135l6-10-3 14Z','#d9ded0');
 }
 if(kind==='owl'){
 art+=S('M67 111Q40 135 44 185Q64 220 103 217Q148 217 158 184Q160 137 130 113Z','url(#$cape)',`stroke="#293f5d" stroke-width="1.8"`)+ellipse(101,161,42,47,'url(#$feather)');
 art+=S('M54 124Q24 130 23 166Q23 187 48 185L72 149Z','url(#$robe)',`stroke="#344a65" stroke-width="1.6"`)+S('M145 124Q178 131 180 164Q181 185 156 184L130 151Z','url(#$robe)',`stroke="#344a65" stroke-width="1.6"`)+line('M31 151q6 20 23 13m-22-4q8 18 21 13m113-24q-7 21-22 15m24-5q-8 18-21 14',light,1.4);
 for(let row=0;row<5;row++)for(let col=0;col<5;col++){let x=75+col*13+(row%2?5:0),y=143+row*11;if(Math.abs(x-102)<31-row*2)art+=S(`M${x-4} ${y}q4 9 8 0q-4 4-8 0`,row%2?'#deeaf0':'#bfcfdd')}
 art+=line('M76 207l-9 17m13-17v18m4-18 8 15m27-15-7 17m12-17 3 19m1-20 12 14','#cdb68a',4)+line('M71 213l7 1m44 0 9-2','#f0d59b',1);
 art+=S('M62 62L52 23L81 44M120 42l28-22-9 47Z','url(#$robe)')+ellipse(102,81,49,40,'url(#$robe)')+S('M54 74Q74 43 102 73Q135 42 151 74Q148 107 120 112L102 101L85 114Q54 108 54 74Z','#e7e9dd');
 art+=ellipse(80,82,15,18,'#faf3da')+ellipse(125,82,15,18,'#faf3da')+ellipse(81,84,9,12,'#5c769a')+ellipse(124,84,9,12,'#5c769a')+ellipse(82,85,5,9,'#283c55')+ellipse(123,85,5,9,'#283c55')+circ(84,78,3,'#fff')+circ(126,78,3,'#fff')+circ(77,89,1.2,'#e4f7ff')+circ(120,89,1.2,'#e4f7ff');
 art+=line('M64 72q13-12 30 1m16-1q18-12 30 0','#94a7b5',1.2)+S('M93 94l9 17 10-17Z','url(#$beak)')+line('M102 98v10','#fff0ac',.9);
 art+=S('M52 61L92 14L113 27L141 62Z','url(#$hat)',`stroke="#30465f" stroke-width="1.8"`)+S('M91 14Q116 5 130 19L111 31Z',mid)+S('M46 63Q94 50 153 64L147 73Q99 64 48 74Z',mid,`stroke="#30465f" stroke-width="1.8"`)+line('M54 62q42-6 88 4',shine,1.7)+star(101,40,9,shine)+runeTrim('M77 49l13-18',light);
 art+=S('M64 119L87 139L101 132L116 140L139 118L130 146L109 154L91 148L75 150Z',dark)+line('M66 120l23 17 12-6 17 10 18-19',light,1.6)+gem(102,145,6,'#efe4a8');
 art+=circ(166,170,22,'url(#$orb)','stroke="#b4d8e3" stroke-width="1"')+circ(166,170,29,'url(#$aura)')+ellipse(166,170,26,7,'none','stroke="#cbd5a4" stroke-width="1.1" transform="rotate(-25 166 170)"')+ellipse(166,170,9,25,'none','stroke="#d4ca9c" stroke-width=".9" transform="rotate(27 166 170)"')+star(166,170,9,'#effdf9')+star(187,137,4)+star(146,143,2);
 }
 const defs=`<defs><linearGradient id="$cape" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${light}"/><stop offset=".32" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></linearGradient><linearGradient id="$robe" x1="0" y1="0" x2="1" y2=".5"><stop stop-color="${light}"/><stop offset=".45" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></linearGradient><linearGradient id="$hat" x2=".2" y2="1"><stop stop-color="${light}"/><stop offset=".45" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></linearGradient><radialGradient id="$skin" cx=".42" cy=".25" r=".9"><stop stop-color="#fff0d5"/><stop offset=".7" stop-color="#e8c5ab"/><stop offset="1" stop-color="#c4948a"/></radialGradient><linearGradient id="$hair" x2="1" y2=".2"><stop stop-color="${kind==='fairy'?'#f9d6dd':'#eeedf5'}"/><stop offset=".5" stop-color="${kind==='fairy'?'#db9bbb':'#cec8e1'}"/><stop offset="1" stop-color="${kind==='fairy'?'#a46c99':'#9c9bbd'}"/></linearGradient><linearGradient id="$paper" x2=".5" y2="1"><stop stop-color="#fff0cf"/><stop offset="1" stop-color="#d4c095"/></linearGradient><linearGradient id="$metal" x2="1" y2=".7"><stop stop-color="#d4d8d7"/><stop offset=".3" stop-color="#9cabb8"/><stop offset=".5" stop-color="#c8cfce"/><stop offset=".56" stop-color="#7d8b9e"/><stop offset="1" stop-color="#46586e"/></linearGradient><linearGradient id="$blade" x2="1" y2="0"><stop stop-color="#dce7e4"/><stop offset=".49" stop-color="#a0bbca"/><stop offset=".51" stop-color="#f4f4db"/><stop offset="1" stop-color="#6589a0"/></linearGradient><radialGradient id="$fur" cx=".35" cy=".2" r="1"><stop stop-color="#e2e0db"/><stop offset=".55" stop-color="#9faab7"/><stop offset="1" stop-color="#67778b"/></radialGradient><linearGradient id="$fox" x2="1" y2="1"><stop stop-color="#e8ba83"/><stop offset=".6" stop-color="#bb885f"/><stop offset="1" stop-color="#875e49"/></linearGradient><linearGradient id="$feather" x2=".2" y2="1"><stop stop-color="#ccdeea"/><stop offset="1" stop-color="#7b94b6"/></linearGradient><linearGradient id="$beak" x2="1" y2="1"><stop stop-color="#f0d28e"/><stop offset="1" stop-color="#b29469"/></linearGradient><linearGradient id="$wing" x2="1" y2="1"><stop stop-color="#d8e9ef" stop-opacity=".7"/><stop offset=".45" stop-color="#e3b4df" stop-opacity=".45"/><stop offset="1" stop-color="#899ac7" stop-opacity=".25"/></linearGradient><linearGradient id="$crystal" x2="1" y2="1"><stop stop-color="#fffaff"/><stop offset=".35" stop-color="#b6d6e6"/><stop offset="1" stop-color="#8277bb"/></linearGradient><radialGradient id="$orb"><stop stop-color="#ecfff2" stop-opacity=".9"/><stop offset=".4" stop-color="#99d2dc" stop-opacity=".5"/><stop offset="1" stop-color="#617ba9" stop-opacity=".15"/></radialGradient><radialGradient id="$aura"><stop stop-color="${shine}" stop-opacity=".32"/><stop offset="1" stop-color="${shine}" stop-opacity="0"/></radialGradient></defs>`;
 return defs+ellipse(100,230,59,7,'#091a244d')+`<g class="sprite-body">${art}</g>`;
}
const CHARACTERS=Object.fromEntries(Object.keys(PAL).map(k=>[k,character(k)]));
export function sprite(kind='scholar',state='resting',size=88){const id='mv2-'+(++serial);return `<svg class="sprite sprite-${kind} sprite-${state}" viewBox="0 0 210 240" width="${size}" height="${size*1.14}" aria-hidden="true">${(CHARACTERS[kind]||CHARACTERS.scholar).replaceAll('$',id)}</svg>`}
export function emblem(size=42){return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M45 10a24 24 0 1 0 7 37A22 22 0 0 1 45 10Z" stroke="currentColor" stroke-width="1.2"/><circle cx="32" cy="32" r="17" stroke="currentColor" stroke-width=".6" stroke-dasharray="1 4" opacity=".45"/><path d="M32 12L36 27L51 32L36 37L32 52L27 37L12 32L27 27Z" stroke="currentColor" stroke-width=".8" fill="currentColor" fill-opacity=".06"/><path d="M32 24L35 30L41 32L35 34L32 41L29 34L23 32L29 30Z" fill="currentColor"/><path d="M50 7v7m-3-4h6M12 48v4m-2-2h4" stroke="currentColor" stroke-width="1"/></svg>`}

function rng(seed=914){let x=seed;return()=>{x=(1664525*x+1013904223)>>>0;return x/4294967296}}
function windowArc(x,y,w,h){return S(`M${x} ${y+h}V${y+w/2}a${w/2} ${w/2} 0 0 1 ${w} 0v${h-w/2}Z`,'url(#mv-window)',`stroke="#d6bd8e" stroke-width="3"`)+line(`M${x+w/2} ${y+2}v${h-2}M${x+2} ${y+w/2}h${w-4}M${x+2} ${y+h*.65}h${w-4}`,'#705c48',1.8)+ellipse(x+w/2,y+h*.62,w*1.9,h*1.25,'url(#mv-warm)')}
function lantern(x,y,s=1){return `<g transform="translate(${x} ${y}) scale(${s})">${circ(0,8,33,'url(#mv-warm)')}${line('M0-8V0','#bea785',1)}${S('M-6 2L0-3L6 2V16L0 21L-6 16Z','url(#mv-window)','stroke="#9e865d" stroke-width="1.2"')}${line('M-6 3H6M-6 16H6M0 3V16','#685a46',1.2)}${circ(1,9,2,'#fff1b3')}</g>`}
function pine(x,y,h,c){let d=`M${x} ${y-h} `;for(let k=1;k<8;k++){let yy=y-h+h*k/8,ww=h*(.06+k*.018);d+=`L${x-ww} ${yy}L${x-ww*.37} ${yy-3} `}d+=`L${x-h*.2} ${y}L${x+h*.2} ${y} `;for(let k=7;k>=1;k--){let yy=y-h+h*k/8,ww=h*(.06+k*.018);d+=`L${x+ww*.37} ${yy-3}L${x+ww} ${yy} `}return S(d+'Z',c)+line(`M${x} ${y-h+10}V${y+7}`,c,3)}
function bush(x,y,s,c){let r=rng(Math.floor(x+y));return `<g transform="translate(${x} ${y}) scale(${s})">${line('M0 0Q-8-31 0-69m-3 37-21-23m20 13 18-20m-14 38-23-19m23 7 22-21','#64836c',1.1)}${Array.from({length:12},(_,i)=>{let yy=-8-i*4,side=i%2?-1:1;return leaf(side*(4+i%3*4),yy,side*(45+r()*30),5+r()*3,c)}).join('')}</g>`}
export function guildScene(){
 const r=rng(),stars=[],trees=[],foliage=[],flowers=[],water=[],stones=[],books=[];
 for(let i=0;i<105;i++){let x=r()*1600,y=r()*315;stars.push(circ(x,y,.5+r()*1.3,'#eddfb5',`class="sky-star" opacity="${.2+r()*.5}" style="animation-delay:-${r()*8}s"`))}
 for(let layer=0;layer<3;layer++)for(let i=0;i<38;i++){let x=i*45+r()*25,y=315+layer*32+r()*40;trees.push(pine(x,y,65+r()*130,['#334c59','#2c4b4e','#274a45'][layer]))}
 for(let i=0;i<125;i++){let angle=r()*Math.PI*2,rad=Math.sqrt(r()),x=330+Math.cos(angle)*210*rad,y=148+Math.sin(angle)*104*rad;let c=['#344f49','#405f4f','#53715a','#607e60','#354f48'][i%5];foliage.push(S(`M${x-17} ${y+5}q-12-19 7-26q6-17 24-12q24-12 34 8q22 7 13 24q3 18-22 15q-27 13-35-2Z`,c,'opacity=".88"'))}
 for(let i=0;i<180;i++){let x=r()*1600,y=492+r()*190;if(x>600&&x<1110&&y>550)continue;flowers.push(line(`M${x} ${y+5}q-2-8 1-13`,'#63866b',.8)+circ(x+1,y-7,1+r()*2,['#d9b9d0','#afbbdc','#d7d8a0','#9cd0b9'][i%4],'opacity=".75"'))}
 for(let i=0;i<44;i++){let y=460+i*5,xx=252+Math.sin(i/10)*60;water.push(line(`M${xx-i*1.1} ${y}q${23+i*1.3}-3 ${55+i*1.9} 0`,'#b7d8ce',.7,`opacity="${.08+r()*.18}"`))}
 for(let i=0;i<19;i++){let y=490+i*11,x=786+Math.sin(i*.25)*65;stones.push(S(`M${x-27-i*.8} ${y}q${28+i*1.4}-6 ${64+i*2} 0l-5 6q-27 5-${59+i*2} 0Z`,i%2?'#9b9c7c':'#6f8069','stroke="#344c42" stroke-width=".6" opacity=".7"'))}
 for(let row=0;row<3;row++)for(let col=0;col<12;col++){let x=487+col*8,y=345+row*28-r()*5;books.push(`<rect x="${x}" y="${y}" width="${5+r()*2}" height="${18+r()*7}" rx=".8" fill="${['#9b8faf','#b89875','#839e99','#ad8598','#bcb492'][col%5]}"/>`+line(`M${x+1} ${y+5}h3m-3 10h3`,'#e0cba180',.7))}
 const arch=`<path d="M695 485V373Q695 321 747 321Q799 321 799 373V485Z" fill="#263b3c" stroke="#b9a47a" stroke-width="5"/>`;
 return `<svg class="guild-landscape illuminated-scene" viewBox="0 0 1600 740" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Moonvale illuminated: a richly detailed woodland guild beneath a crescent moon, with a golden library, ivy-covered stone house, observatory, running creek, wildflowers and lanterns."><defs>
 <linearGradient id="mv-sky" x2="0" y2="1"><stop stop-color="#132234"/><stop offset=".55" stop-color="#294457"/><stop offset="1" stop-color="#63817c"/></linearGradient><radialGradient id="mv-moon"><stop stop-color="#efdfac" stop-opacity=".22"/><stop offset=".4" stop-color="#9fc4c2" stop-opacity=".10"/><stop offset="1" stop-color="#c5d9d3" stop-opacity="0"/></radialGradient>
 <linearGradient id="mv-ground" x2=".15" y2="1"><stop stop-color="#617959"/><stop offset=".4" stop-color="#3e6550"/><stop offset="1" stop-color="#173d39"/></linearGradient><linearGradient id="mv-cliff" x2="0" y2="1"><stop stop-color="#3e5147"/><stop offset="1" stop-color="#142d34"/></linearGradient><linearGradient id="mv-creek" x2=".2" y2="1"><stop stop-color="#86b9aa"/><stop offset=".45" stop-color="#508d89"/><stop offset="1" stop-color="#284e62"/></linearGradient>
 <linearGradient id="mv-wall" x2="1" y2=".2"><stop stop-color="#b9ad88"/><stop offset=".5" stop-color="#908e73"/><stop offset="1" stop-color="#677761"/></linearGradient><linearGradient id="mv-roof" x2=".3" y2="1"><stop stop-color="#7685a0"/><stop offset=".45" stop-color="#4b637d"/><stop offset="1" stop-color="#263c54"/></linearGradient><linearGradient id="mv-wood" x2="1" y2=".5"><stop stop-color="#af976a"/><stop offset="1" stop-color="#4c5c4b"/></linearGradient>
 <linearGradient id="mv-window" x2="0" y2="1"><stop stop-color="#ffefb7"/><stop offset=".5" stop-color="#e5be77"/><stop offset="1" stop-color="#a57345"/></linearGradient><radialGradient id="mv-warm"><stop stop-color="#f7ce8c" stop-opacity=".23"/><stop offset=".35" stop-color="#ecc084" stop-opacity=".1"/><stop offset="1" stop-color="#e8bd7d" stop-opacity="0"/></radialGradient>
 <radialGradient id="mv-fog"><stop stop-color="#b5cfc1" stop-opacity=".15"/><stop offset="1" stop-color="#b5cfc1" stop-opacity="0"/></radialGradient><linearGradient id="mv-glass" x2="1" y2="1"><stop stop-color="#b3cdd0" stop-opacity=".7"/><stop offset=".35" stop-color="#719b96" stop-opacity=".15"/><stop offset="1" stop-color="#426c6b" stop-opacity=".5"/></linearGradient>
 <pattern id="mv-slates" width="30" height="15" patternUnits="userSpaceOnUse"><path d="M0 0v5q0 10 15 10T30 5V0" fill="none" stroke="#b3c0ce" stroke-opacity=".32" stroke-width=".9"/><path d="M3 1v3m27 0v2" stroke="#e4e1d8" stroke-opacity=".15" stroke-width="2"/></pattern>
 <pattern id="mv-stone" width="53" height="31" patternUnits="userSpaceOnUse"><path d="M0 0H53M0 16H53M0 31H53M24 0V16M7 16V31M48 16V31" fill="none" stroke="#4b5d4a" stroke-opacity=".32" stroke-width="1.5"/><path d="M3 2h16m9 0h21M10 18h32" stroke="#dfd8b3" stroke-opacity=".23" stroke-width="1"/></pattern>
 <filter id="mv-grain"><feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".035"/></feComponentTransfer><feBlend in="SourceGraphic" mode="soft-light"/></filter>
 <filter id="mv-blur"><feGaussianBlur stdDeviation="5"/></filter><filter id="mv-glow"><feGaussianBlur stdDeviation="1.5"/></filter>
 </defs>
 <rect width="1600" height="740" fill="url(#mv-sky)"/>${circ(1222,120,350,'url(#mv-moon)')}${stars.join('')}
 <g opacity=".32" stroke="#c9d6d4" stroke-width=".7" fill="none"><path d="M95 119L158 79L217 119L269 69M1376 70L1408 112L1482 88L1520 151"/></g>${[ [95,119],[158,79],[217,119],[269,69],[1376,70],[1408,112],[1482,88],[1520,151]].map(([x,y])=>star(x,y,2.5,'#dce0cf')).join('')}
 ${S('M0 293L105 183L191 256L306 147L444 279L518 230L636 285L757 174L827 213L931 150L1025 263L1136 199L1268 263L1385 159L1543 256L1600 217V425H0Z','#385567','opacity=".7"')}
 ${S('M0 342L152 264L273 323L419 221L578 327L708 255L851 337L977 238L1122 322L1277 231L1440 318L1600 257V460H0Z','#3e6165','opacity=".8"')}${trees.join('')}
 ${ellipse(280,371,430,40,'url(#mv-fog)')}${ellipse(1309,389,450,45,'url(#mv-fog)')}
 ${circ(1221,128,48,'#e9e1bd')}${circ(1240,111,46,'#233b4f')}${line('M1142 148q-3-69 61-83','#cedad255',.8)}
 ${S('M58 461Q164 385 317 414Q537 339 735 403Q958 342 1175 409Q1358 367 1531 471L1556 607Q1394 691 1205 682Q910 729 677 706Q286 753 65 621Z','url(#mv-cliff)')}
 ${S('M46 453Q165 382 317 412Q522 337 735 400Q959 340 1174 406Q1358 364 1540 464Q1593 524 1518 578Q1390 637 1172 617Q921 675 669 650Q282 708 73 594Q24 544 46 453Z','url(#mv-ground)','stroke="#93a283" stroke-opacity=".4" stroke-width="2"')}
 ${S('M428 405Q239 422 302 459Q422 514 297 557Q129 597 271 698H103Q15 603 187 550Q338 504 209 467Q169 424 321 401Z','url(#mv-creek)','stroke="#9ab9a1" stroke-width="2"')}${water.join('')}
 ${line('M394 410q-174 19-80 62q110 49-39 91q-158 43-39 129','#dbdac277',1.3)}${line('M170 586q-65 28-30 77m12-30q-23-24 20-39','#b7d4c077',1.2)}
 ${S('M717 476Q707 505 792 535Q898 587 876 637L831 740H1050Q1085 670 935 586Q819 528 801 477Z','#99a07d','opacity=".35"')}${stones.join('')}
 <!-- Great willow, beautifully sheltering the library -->
 ${S('M290 442Q331 369 305 281Q275 220 221 181L243 163Q303 188 331 241Q346 166 320 109L347 110Q382 185 362 251Q413 206 427 159L446 166Q428 232 376 275Q361 328 383 408L418 443L368 434L331 454L311 445Z','url(#mv-wood)','stroke="#233d38" stroke-width="3"')}
 ${line('M339 433q18-70-2-159q-7-51-53-84m69 85q42-50 66-84M344 196q14-28-5-67M311 407l18-14m38-79 10 78','#c1b28a44',2)}${foliage.join('')}
 ${Array.from({length:14},(_,i)=>{let x=155+i*24,y=176+Math.sin(i)*16;return line(`M${x} ${y}q-18 47-2 80`,'#66865b',1.5)+Array.from({length:5},(_,k)=>leaf(x-3,y+14+k*11,k%2?-35:35,5,'#83a576')).join('')}).join('')}
 <!-- Stone library wing -->
 ${S('M437 308L557 261L639 326V475L444 500Z','url(#mv-wall)','stroke="#394b43" stroke-width="3"')}${S('M437 308L557 261L639 326V475L444 500Z','url(#mv-stone)')}
 ${S('M414 316L528 206L653 315L600 351L528 257L470 339Z','url(#mv-roof)','stroke="#253b4a" stroke-width="3"')}${S('M414 316L528 206L653 315L600 351L528 257L470 339Z','url(#mv-slates)')}${line('M412 317L528 205L655 317M528 207l1 49 70 94','#c7ba93',3)}
 ${S('M474 433V337Q474 307 520 307Q579 305 589 335V432Z','#223b3e','stroke="#d4bc8f" stroke-width="4"')}${books.join('')}${line('M477 369H589M477 398H589M477 429H589M514 309V433M553 313V433','#c0a47b',3)}${ellipse(532,372,110,115,'url(#mv-warm)')}
 ${S('M466 437L599 435L604 444L462 448Z','#c2b38a','stroke="#5b6a52" stroke-width="2"')}${line('M466 459l135-7m-130 23 128-7','#56684f',1.4)}
 <!-- Main hall: gable face, shaded side wall, carved oak entrance -->
 ${S('M614 252L823 250L939 319V479L791 496L624 485Z','url(#mv-wall)','stroke="#30493f" stroke-width="3"')}${S('M614 252L823 250L939 319V479L791 496L624 485Z','url(#mv-stone)')}${S('M812 269L936 319V480L816 485Z','#5b715c','opacity=".58"')}
 ${S('M579 285L743 128L893 259L962 334L840 303L743 201L659 313Z','url(#mv-roof)','stroke="#243a4d" stroke-width="3"')}${S('M579 285L743 128L893 259L962 334L840 303L743 201L659 313Z','url(#mv-slates)')}${line('M577 286L742 126L964 335M743 129V202L841 303','#d1c29b',3.8)}
 ${S('M627 308L743 201L840 303V488L627 496Z','url(#mv-wall)','stroke="#c5b790" stroke-width="2"')}${S('M627 308L743 201L840 303V488L627 496Z','url(#mv-stone)')}${line('M639 310L743 216L828 307M743 218V312M679 276v209M814 285v198M634 326l194-8','#50604b',6)}
 ${circ(745,282,40,'#263e42','stroke="#d5c597" stroke-width="5"')}${circ(745,282,32,'url(#mv-window)')}${line('M745 249V316M712 282H778M722 259l46 45m-46 0 47-45','#877252',1.8)}${circ(745,282,77,'url(#mv-warm)')}${star(745,282,9,'#fae6a8')}
 ${arch}${S('M704 483V376q0-42 43-43q42 0 43 43V483Z','#765f45')}${S('M706 377q0-42 41-42q42 0 42 42Z','url(#mv-window)')}${line('M747 336V377M715 349l25 28m37-28-25 28M708 389H787M709 399H787M747 392V482','#ceb27b',1.6)}${circ(775,435,3,'#e7cc8f')}${line('M724 404v67m44-66v64','#554e3b',1)}${line('M727 354q19-8 38 0','#ffedb9',1)}
 ${S('M688 482L806 481L820 493L677 499Z','#c9c19b','stroke="#516549" stroke-width="2"')}${S('M677 499L820 493L831 508L661 516Z','#919b79','stroke="#4a604a" stroke-width="2"')}${S('M661 516L831 508L839 521L653 533Z','#718663','stroke="#3b5947" stroke-width="2"')}
 ${windowArc(854,347,37,80)}${line('M846 436l57-5m-55 17 55-5','#ab9d77',3)}
 <!-- dormer -->
 ${S('M851 280V223L878 213L903 235V298Z','#809079','stroke="#3f594d" stroke-width="2"')}${S('M838 230L869 192L916 235L891 246Z','url(#mv-roof)','stroke="#b3b595" stroke-width="2"')}${windowArc(861,235,23,40)}
 <!-- chimney -->
 ${S('M805 190V123L831 123L837 217Z','#9b9b7a','stroke="#45594b" stroke-width="2"')}${S('M805 190V123L831 123L837 217Z','url(#mv-stone)')}${S('M799 125V113H837V125Z','#bbb590','stroke="#59654e" stroke-width="2"')}<g class="chimney-smoke" fill="none" stroke="#d2d9c7" opacity=".16"><path d="M817 101Q793 78 818 62Q839 48 826 24" stroke-width="11"/><path d="M827 92Q847 72 837 56" stroke-width="6"/></g>
 <!-- glazed conservatory -->
 ${S('M925 356L1014 314L1105 362V471L1006 488L925 467Z','#4e715e','stroke="#2d4d42" stroke-width="2"')}${S('M925 356L1014 314L1105 362L1005 399Z','url(#mv-glass)','stroke="#b8c39d" stroke-width="2"')}${S('M937 370L997 403V474L937 459Z','url(#mv-glass)','stroke="#b6bfa0" stroke-width="2"')}${S('M1012 404L1094 373V465L1012 480Z','url(#mv-glass)','stroke="#b6bfa0" stroke-width="2"')}${line('M952 378V462M977 393V469M1034 397V476M1061 385V471M1082 379V467M1013 442l81-26M939 418l58 30M959 341l95 40M969 379l97-40','#a6bc9c',2)}
 ${bush(965,450,.7,'#86ae79')}${bush(1036,461,.75,'#97b188')}${bush(1080,451,.6,'#b0b17b')}${[965,1036,1080].map(x=>S(`M${x-10} 449h22l-4 18h-13Z`,'#af8866')).join('')}
 <!-- observatory hill and star dome -->
 ${S('M1104 454L1107 249L1200 241L1260 286V452L1162 473Z','url(#mv-wall)','stroke="#365343" stroke-width="3"')}${S('M1104 454L1107 249L1200 241L1260 286V452L1162 473Z','url(#mv-stone)')}${S('M1201 243L1260 286V452L1200 459Z','#58715d','opacity=".5"')}
 ${S('M1085 276Q1083 160 1160 155Q1243 156 1280 278L1206 303Z','url(#mv-roof)','stroke="#354b62" stroke-width="3"')}${line('M1084 276Q1173 245 1280 278M1160 156q-54 42-34 116M1160 156q11 54 6 111M1160 156q64 37 77 116','#b0b9ad',1.6)}${line('M1159 155v-36m-10 17h23','#d9c594',2)}${star(1159,119,9,'#e0cf9c')}
 ${windowArc(1136,319,39,69)}${windowArc(1212,324,22,48)}${line('M1090 393L1216 379L1274 409M1097 384v27m27-31v25m27-29v24m27-27v23m29-24v24','#aeb493',3)}
 ${S('M1084 414L1210 398L1277 423L1146 443Z','#8fa086','stroke="#415f4d" stroke-width="2"')}${S('M1138 444L1271 425L1270 436L1139 456Z','#56735c')}
 <!-- telescope -->
 ${line('M1194 414l-20 31m20-31 18 29m-18-32v36','#d1b58a',2)}${S('M1181 405l45-26 8 14-44 26Z','#65858f','stroke="#d8c393" stroke-width="2"')}${line('M1185 407l43-25','#bfd5d2',2)}${S('M1227 377l9 15 5-3-8-16Z','#c8bc8d')}
 <!-- low bridge -->
 ${S('M214 496Q268 452 360 483L389 505Q285 477 231 522Z','#c0b58e','stroke="#50654e" stroke-width="2"')}${line('M220 491v-25m31 13v-25m33 17v-24m36 24v-23m36 28v-25M218 468Q279 433 359 452','#a9b08b',4)}${line('M241 507l13-16m8 12 13-17m10 15 11-15m11 13 7-12m16 13 5-10','#787b5b',1.2)}
 <!-- library reading table -->
 ${ellipse(482,524,71,14,'#122e305c')}${S('M432 486L510 474L552 494L472 511Z','url(#mv-wood)','stroke="#5b6148" stroke-width="2"')}${line('M442 500v29m98-25v20m-66-11v26','#647053',6)}${S('M452 484l30-5 22 11-30 6Z','#eeddb2')}${line('M481 480l-7 16','#b39b76',1)}${lantern(519,475,.9)}
 <!-- garden forge -->
 ${S('M1030 541L1034 491L1067 458L1116 465L1140 505L1136 551Z','#73816b','stroke="#344f41" stroke-width="3"')}${S('M1030 541L1034 491L1067 458L1116 465L1140 505L1136 551Z','url(#mv-stone)')}${S('M1048 535q0-47 38-45q38 0 36 42Z','#293c3b')}${S('M1061 532q-8-22 9-35q-7 12 5 21q4-29 15-35q-1 22 15 32q9 9 4 15Z','#e5b36e','class="forge-flame"')}${S('M1071 531q-1-15 12-20q1 14 14 20Z','#ffde8d')}${ellipse(1085,517,67,56,'url(#mv-warm)')}${line('M1048 535h74','#b6a277',4)}
 ${S('M1154 527L1195 520L1206 527L1187 538L1182 554L1156 557L1163 539L1137 538Z','#788f93','stroke="#354d48" stroke-width="2"')}${line('M1143 533l50-7','#c0cec6',2)}${S('M1160 555L1188 551L1195 571L1148 576Z','#8d8061')}
 <!-- wishing shrine / trail marker -->
 ${S('M1354 507V455Q1351 428 1373 426Q1396 426 1397 453V500Z','#66866b','stroke="#314f43" stroke-width="2"')}${S('M1363 492V453q0-16 12-16q13 0 14 16V487Z','#344f4c')}${star(1376,456,10,'#cfdaa9')}${circ(1376,456,35,'url(#mv-warm)')}${line('M1350 505l50-6m-54 16 59-6','#95a07a',3)}
 ${line('M1441 514V426','#9f926c',5)}${S('M1410 438l60-7 12 8-11 9-61 5Z','#779077','stroke="#b3b896" stroke-width="1.5"')}${line('M1420 443l25-3m-1-5 6 4-5 6','#dde0b7',1.2)}
 <!-- strings of tiny lanterns and hanging crescent plaque -->
 ${line('M361 276Q399 347 481 330M848 290Q971 349 1086 281','#bdad82',1.2)}${[[380,300],[414,326],[450,334],[882,307],[929,320],[980,318],[1030,306]].map(([x,y])=>lantern(x,y,.6)).join('')}${lantern(659,363,1.05)}${lantern(827,359,1.05)}${lantern(1311,450,1)}
 ${line('M645 337v-20h-28v30','#a7a780',2)}${S('M604 341L631 337L638 360L611 366Z','#35504d','stroke="#c6b686" stroke-width="1"')}${S('M623 343a7 7 0 1 0 5 12a5 5 0 0 1-5-12','#e5cf94')}
 <!-- ivy and wildflowers -->
 ${[ [605,424],[651,471],[860,462],[912,463],[435,455],[1290,505],[1347,532]].map(([x,y],i)=>bush(x,y,.7+i%3*.15,['#91aa72','#6d9c6d','#b4b17f'][i%3])).join('')}
 ${line('M624 472q-13-60 12-107q-19-55 11-79M827 477q29-39 8-90','#78916a',2)}${Array.from({length:22},(_,i)=>leaf(633+Math.sin(i)*8,475-i*8,i%2?55:-55,4.5+i%3,'#83a278')).join('')}${flowers.join('')}
 ${Array.from({length:8},(_,i)=>bush(43+i*22,631+i%3*15,1.2+i%2*.3,['#527f67','#4c745f','#658e70'][i%3])).join('')}${Array.from({length:8},(_,i)=>bush(1405+i*24,660-i%3*15,1.1+i%2*.4,['#50796c','#41695f','#719273'][i%3])).join('')}
 ${[ [377,544,1],[1258,584,.8],[139,552,.7],[1452,572,.7]].map(([x,y,s])=>`<g transform="translate(${x} ${y}) scale(${s})">${line('M0 0v24m22-11v18','#d8cfa9',5)}${S('M-18 2q5-33 36 0Z','#c79cab')}${S('M8 15q5-27 31 0Z','#ac9ebb')}${circ(-4,-8,2.5,'#f4e5d2')}${circ(7,-3,2,'#f4e5d2')}${circ(25,7,2,'#e9dbe2')}</g>`).join('')}
 ${Array.from({length:29},(_,i)=>circ(100+r()*1400,367+r()*310,1+r()*1.6,'#f3e7ab',`class="firefly" filter="url(#mv-glow)" style="animation-delay:-${r()*9}s"`)).join('')}
 <rect width="1600" height="740" fill="transparent" filter="url(#mv-grain)" opacity=".52" pointer-events="none"/>
 </svg>`;
}
