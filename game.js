(() => {
  'use strict';
  const SAVE_KEY = 'world-beyond.day-zero.v1';
  const objectIds = ['clock', 'ticket', 'lamp', 'stranger', 'door'];
  const freshState = () => ({ version: 1, visited: [], notes: [], ticket: false, identity: null, lamp: null, ended: false, secret: false });
  let state = freshState();
  let storageAvailable = true;
  let selected = null;
  let loadMessage = '';
  // Story data and scene handlers stay separate from persistence and rendering.
  // Future maps can register additional scenes here without changing the save/UI layer.
  const scenes = {
    clock() {
      addNote('站钟停在零点。背面刻着：不要替海点灯。');
      if (state.lamp === 'extinguish' && state.identity === 'truth') {
        state.secret = true;
        addNote('黑暗里，钟响了十三下。有人叫你「归来的人」。');
        return show('停摆的钟', '你听见了第十三声。', ['指针没有动，钟却响了十三下。每一声都像来自水底。', '钟面上映出陌生人的嘴形：「欢迎回来。」你转过身，他仍背对着你。']);
      }
      show('停摆的钟', '零点之后，没有刻度。', ['钟的背面刻着一行小字：「不要替海点灯。」字迹很新，刻痕里还留着盐。', state.lamp === 'kindle' ? '灯亮以后，秒针开始向后颤动。它始终走不出最后一秒。' : '你把耳朵贴近钟面。里面传来一声很轻的敲门声。']);
    },
    ticket() {
      if (!state.ticket) {
        state.ticket = true;
        addNote('拾到一张单程票。目的地被划去，乘客姓名是空白。');
      }
      show('长椅上的纸片', '一张没有目的地的车票。', ['你把纸片收进口袋。纸上只有「单程」二字，以及一栏空白的乘客姓名。', state.identity === 'borrowed' ? '空白处慢慢渗出一个「林」字。那不是你的名字。至少，你刚才并不这样认为。' : '翻到背面，你认出一句话：「若有人问起，不要轻易留下名字。」']);
    },
    stranger() {
      if (!state.identity) {
        return show('候车的人', '「这次，你还记得自己吗？」', ['他的影子朝着海，身体却朝着你。那张脸像一张被雨打湿的旧照片。', '「我需要一个称呼。」他说。「这里会记住你说的话。」'], [
          ['承认：我不记得自己的名字', () => chooseIdentity('truth')],
          ['借用一个名字：叫我林吧', () => chooseIdentity('borrowed')]
        ]);
      }
      const memory = state.identity === 'truth'
        ? '「你说过你不记得。」他替你挡住了从海上吹来的风。「忘记有时是你留给自己的退路。」'
        : '「林。」他准确地叫出那个借来的名字。「海已经听见了。下次，别换一个。」';
      const response = !state.lamp ? '「那盏灯只够燃烧一次。想看清路，就得让某些东西也看清你。」'
        : state.lamp === 'kindle' ? '「你把灯留下了。」他望着远处。「现在，它也知道站台在哪里了。」'
        : state.identity === 'truth' ? '「你让它暗下来了。去听一听那只钟吧。有些声音，只肯对诚实的黑暗说话。」'
        : '「灯灭了，可你的名字还亮着。」他后退了一步，像在给另一个人让出位置。';
      show('候车的人', state.identity === 'truth' ? '他还记得你的沉默。' : '他还记得那个名字。', [memory, response]);
    },
    lamp() {
      if (state.lamp) {
        return show('最后一盏灯', state.lamp === 'kindle' ? '光在替你指路。' : '黑暗不是空的。', [state.lamp === 'kindle' ? '灯焰里有一只很小的眼睛。光落到海上，照出通往那扇门的石阶。' : '灯已经熄灭。潮水漫上站台，在你的脚边留下一串反向的脚印。', '这盏灯已经接受了你的选择。']);
      }
      show('最后一盏灯', '灯芯里，藏着一粒星光。', ['玻璃罩上结满盐霜。你知道，只要用手拢住灯芯，它就会重新亮起来。', '或者，你可以吹灭它。海正安静地等着。'], [
        ['拢住灯芯，让光留下', () => chooseLamp('kindle')],
        ['吹灭灯火，听海的声音', () => chooseLamp('extinguish')]
      ]);
    },
    door() {
      if (state.ended) return ending();
      if (!state.ticket || !state.identity || !state.lamp) {
        const hints = [];
        if (!state.ticket) hints.push('口袋里似乎还少了一件能让你出发的东西。');
        if (!state.identity) hints.push('候车的人抬起头。他像是有话要对你说。');
        if (!state.lamp) hints.push('最后一盏灯在风里摇晃。它还在等你的回答。');
        return show('海上的门', '它比刚才近了一点。', ['门孤零零地站在海面上，没有墙，也没有倒影。', ...hints]);
      }
      show('海上的门', state.lamp === 'kindle' ? '石阶浮出了水面。' : '潮水替你让出一条窄路。', [state.identity === 'borrowed' ? '门里传来一声「林」。你口袋里的票变得滚烫。' : '门里的人没有叫你的名字，只敲了两下。像是在等待一个约定好的回答。', '你的车票上，出现了一个日期：第零天。'], [['将车票贴近门缝', () => { state.ended = true; addNote('门已经回应。车票上的日期是：第零天。'); ending(); save(); render(); }]]);
    }
  };
  const $ = id => document.getElementById(id);
  function addNote(note) { if (!state.notes.includes(note)) state.notes.push(note); }
  function show(speaker, title, paragraphs, choices = []) {
    $('speaker').textContent = speaker;
    $('dialogue-title').textContent = title;
    $('dialogue-text').replaceChildren(...paragraphs.map(text => { const p = document.createElement('p'); p.textContent = text; return p; }));
    $('choices').replaceChildren(...choices.map(([label, action]) => {
      const button = document.createElement('button'); button.textContent = label;
      button.addEventListener('click', () => { action(); focusNarrative(); });
      return button;
    }));
    $('consequence').textContent = '';
  }
  function chooseIdentity(choice) {
    if (state.identity) return;
    state.identity = choice;
    addNote(choice === 'truth' ? '我承认了失忆。候车的人愿意告诉我更多。' : '我借用了「林」这个名字。候车的人记住了它。');
    scenes.stranger(); save(); render();
    $('consequence').textContent = choice === 'truth' ? '◈ 他记住了你的坦诚。' : '◈ 这个名字已被记住。车票上的字迹正在改变。';
  }
  function chooseLamp(choice) {
    if (state.lamp) return;
    state.lamp = choice;
    addNote(choice === 'kindle' ? '我留下了光。海面浮出石阶，钟开始倒走。' : '我熄灭了灯。潮水漫上站台，带来了脚印。');
    scenes.lamp(); save(); render();
    $('consequence').textContent = choice === 'kindle' ? '◈ 海上的门亮了。某个远处的东西也醒了。' : '◈ 潮水上涨了。熟悉的地方，也许有了新的声音。';
  }
  function ending() {
    const lines = state.lamp === 'kindle'
      ? ['门缝里透出的光照亮了另一座候车站。那里的长椅上，睡着一个与你一模一样的人。', state.identity === 'truth' ? '身后的人低声说：「这一次，别替他回答。」' : '那个人睁开眼睛，叫出了你借来的名字。']
      : ['门后没有路，只有一段从水底升起的楼梯。每一级台阶上，都有一双湿脚印。', state.identity === 'truth' ? '候车的人第一次笑了：「这次，我陪你走到这里。」' : '水下传来你的声音：「林，你终于来了。」'];
    if (state.secret) lines.push('第十三声钟响，终于追上了你。');
    show('第零天 · 未完', '门开了一条缝。', [...lines, '这一段旅程到此暂歇。你仍可以回到站台，查看那些被选择改变的事物。']);
    $('consequence').textContent = '探索已保存 · 站台仍然可以探索';
  }
  function render() {
    document.body.dataset.lamp = state.lamp || 'waiting';
    document.body.dataset.ended = String(state.ended);
    $('atmosphere').textContent = state.lamp === 'kindle' ? '海上有了路。雾里有了目光。' : state.lamp === 'extinguish' ? '潮水正在上涨。黑暗中，有人在数数。' : '海没有声音。时钟没有明天。';
    $('scene-status').textContent = state.lamp === 'kindle' ? '◌ 灯火未眠' : state.lamp === 'extinguish' ? '◌ 潮水已至' : '◌ 雾尚未散去';
    $('note-count').textContent = String(state.notes.length).padStart(2, '0');
    $('notes').replaceChildren(...(state.notes.length ? state.notes : ['触碰这个世界，留下第一道痕迹。']).map(note => { const li = document.createElement('li'); li.textContent = note; if (!state.notes.length) li.className = 'empty-note'; return li; }));
    $('inventory').textContent = state.ticket ? (state.identity === 'borrowed' ? '单程车票 · 林' : '单程车票 · 无名') : '空空如也';
    document.querySelectorAll('[data-object]').forEach(button => {
      button.classList.toggle('visited', state.visited.includes(button.dataset.object));
      button.classList.toggle('active', button.dataset.object === selected);
      button.setAttribute('aria-pressed', String(button.dataset.object === selected));
    });
    $('save-status').textContent = storageAvailable ? '进度自动保存在此浏览器' : '浏览器存储不可用 · 本次进度仅在当前页面保留';
  }
  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); storageAvailable = true; }
    catch { storageAvailable = false; }
  }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || data.version !== 1 || !Array.isArray(data.visited) || !data.visited.every(id => objectIds.includes(id)) || !Array.isArray(data.notes) || !data.notes.every(note => typeof note === 'string' && note.length < 300) || ![null, 'truth', 'borrowed'].includes(data.identity) || ![null, 'kindle', 'extinguish'].includes(data.lamp) || !['ticket', 'ended', 'secret'].every(key => typeof data[key] === 'boolean') || (data.ended && (!data.ticket || !data.identity || !data.lamp))) throw new Error('Invalid save');
      state = { ...freshState(), version: 1, visited: [...new Set(data.visited)], notes: [...new Set(data.notes)], ticket: data.ticket, identity: data.identity, lamp: data.lamp, ended: data.ended, secret: data.secret };
      loadMessage = '你回到了这座站台。这里还记得你留下的痕迹。';
    } catch (error) {
      if (error.name === 'SecurityError') storageAvailable = false;
      else loadMessage = '旧存档无法读取，已从新的第零天开始。';
    }
  }
  function focusNarrative() {
    $('dialogue-title').focus({ preventScroll: true });
    if (window.matchMedia('(max-width: 800px), (pointer: coarse)').matches) {
      $('narrative').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
  }
  $('back-to-scene').addEventListener('click', () => {
    $('explore-scene').focus({ preventScroll: true });
    $('explore-scene').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });
  document.querySelectorAll('[data-object]').forEach(button => button.addEventListener('click', () => {
    selected = button.dataset.object;
    if (!state.visited.includes(selected)) state.visited.push(selected);
    scenes[selected](); save(); render();
    focusNarrative();
  }));
  $('reset').addEventListener('click', () => $('reset-dialog').showModal());
  $('cancel-reset').addEventListener('click', () => $('reset-dialog').close());
  $('confirm-reset').addEventListener('click', () => {
    state = freshState(); selected = null; save(); render(); $('reset-dialog').close();
    show('醒来的片刻', '你来得比昨天更早。', ['你在一张潮湿的长椅上醒来。口袋是空的，鞋底却沾着星光。', '远处有人站着。似乎已经等了很久。']);
    $('dialogue-title').focus({ preventScroll: true });
  });
  load(); render();
  if (state.ended) ending();
  else if (loadMessage) $('consequence').textContent = loadMessage;
})();
