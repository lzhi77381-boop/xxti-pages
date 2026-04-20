import React, { useState, useEffect, useRef } from "react";
import Bmob from "hydrogen-js-sdk";

// ============ 初始化云端数据库 (Bmob) ============
// 请填入你在 Bmob 控制台获取的两个密钥
Bmob.initialize("f36e4aafdd433dd5", "MySecretKey12345");

// ============ 云端适配器 (带防并发爆炸缓存) ============
const cloudCache = {};

window.storage = {
  list: async (prefix) => {
    try {
      const query = Bmob.Query("SoulComment");
      // 拉取最新留言，免费版一次最多 1000 条
      query.limit(1000); 
      // 按创建时间倒序，保证新留言在最上面
      query.order("-createdAt"); 
      const results = await query.find();

      const keys = [];
      results.forEach(item => {
        // Bmob 返回的数据直接挂在对象的属性上
        const k = item.key;
        // 简单过滤：只返回符合当前人格 prefix 的 key
        if (k && k.startsWith(prefix)) {
          keys.push(k);
          // 核心优化：拉取列表时直接把内容存入缓存
          cloudCache[k] = item.value; 
        }
      });
      return { keys };
    } catch (error) {
      console.error('获取留言列表失败:', error);
      return { keys: [] };
    }
  },
  
  get: async (key) => {
    // 优先从缓存读取，避免原代码 map 循环引发的 N+1 并发请求爆炸
    if (cloudCache[key]) {
      return { value: cloudCache[key] };
    }
    
    try {
      const query = Bmob.Query("SoulComment");
      query.equalTo("key", "==", key);
      const results = await query.find();
      if (results && results.length > 0) {
        cloudCache[key] = results[0].value;
        return { value: results[0].value };
      }
      return null;
    } catch (error) {
      console.error('获取单条留言失败:', error);
      return null;
    }
  },
  
  set: async (key, value) => {
    try {
      // 在 Bmob 中自动创建 SoulComment 表并插入数据
      const query = Bmob.Query("SoulComment");
      query.set("key", key);
      query.set("value", value);
      await query.save();

      cloudCache[key] = value; // 更新本地缓存
      return true;
    } catch (error) {
      console.error('保存留言失败:', error);
      return false;
    }
  }
};



// ============ 数据：16人格 ============
const PERSONAS = {
  yanlingdao: {
    code: "内·刚·独·进",
    name: "雁翎刀",
    tagline: "你的每一次锋利，都是对自己的忠诚。",
    description: [
      "你是那种走到哪里都把「什么是值得严肃对待的」重新定义一遍的女性。你的眼神是有力的，有时候让人不舒服。",
      "你不愿意被任何人代表，你也不愿意代表任何人。你只为自己的判断负责。",
      "你的爱、你的愤怒、你的热情，全都是有重量的——因为你从不假装。"
    ],
    character: {
      name: "简·爱",
      book: "《简·爱》",
      author: "夏洛蒂·勃朗特",
      year: "1847",
      intro: "她出身贫寒，身材矮小，相貌平凡——按那个时代的算法，她应该沉默、顺从、心怀感激。但她偏不。她对罗切斯特说出那句一百多年来仍在回响的话：「你以为我贫穷、卑微、不美丽，我就没有灵魂没有心吗？你错了——我们的灵魂是平等的。」她教所有女性的一件事是：爱情可以热烈，但你在爱情里的站姿，必须是直的。哪怕对方有钱、有权、有你爱的一切，你也绝不踮脚、绝不下跪、绝不把自己折价。",
      link: "她把「我配得上」这四个字，写进了所有后来女性的血里。"
    }
  },
  dingxingpan: {
    code: "内·刚·独·慢",
    name: "定星盘",
    tagline: "风浪归风浪，你归你。",
    description: [
      "你是那种在所有人都乱的时候，能指出「北」在哪里的女性。你不吵，但你很难被带偏。",
      "你的判断是慢的，一旦落下来，就像锚入海底——风浪归风浪，你归你。",
      "别人以为你冷静，其实你只是比他们早一步看完了整件事的结局。"
    ],
    character: {
      name: "艾琳娜·达什伍德",
      book: "《理智与情感》",
      author: "简·奥斯汀",
      year: "1811",
      intro: "家里塌了天，父亲去世、财产被夺、母亲和妹妹乱作一团——她没哭。她安静地算账、安抚家人、处理所有烂摊子，然后在夜里独自消化自己的心碎。她爱的男人被订了亲，她听到消息的那一刻，脸色都没变，因为她知道：这个家的稳定比她的心动更要紧。她不是没有感情，她是把感情放在了「先把事做完」的后面。这种克制不是冷漠，是一种极少数人才拥有的成年。",
      link: "她替所有人扛住事，替自己留一寸静——你认得这种沉默。"
    }
  },
  qingtongjing: {
    code: "内·刚·共·慢",
    name: "青铜镜",
    tagline: "清醒是有代价的，但清醒本身，就是奖赏。",
    description: [
      "你话不多，但你看人很准。你见过太多人用漂亮的话掩盖空洞，所以你开始更相信沉默。",
      "你温柔，但你的温柔不廉价——它是有门槛的，是给少数人的通行证。",
      "你不急着被理解。你更怕被廉价地理解。"
    ],
    character: {
      name: "林黛玉",
      book: "《红楼梦》",
      author: "曹雪芹",
      year: "十八世纪",
      intro: "所有人都说她爱哭、小性子、难伺候。但真正读懂她的人知道——她的敏感不是缺陷，是一种未被污染的感知力。她看得见大观园表面的富贵底下烂掉的根，她听得懂别人客气话里藏着的冷刀，她一眼就能分辨出谁是真心、谁是敷衍。她写诗、葬花、不肯向世俗低头一寸。她不是不懂怎么讨人喜欢，她是拒绝用那种方式活着。她用一生证明了：清醒是有代价的，但清醒本身，就是奖赏。",
      link: "她的孤傲里，藏着你从未向人展示过的那份清醒。"
    }
  },
  hanmeizhi: {
    code: "内·刚·共·进",
    name: "寒梅枝",
    tagline: "外面看是软的，内里烧不化。",
    description: [
      "你是那种「温柔地坚持」的人。你的反对从不靠嗓门，你的力量也从不靠姿态。",
      "你愿意为你在乎的人站出来，代价再大也行；但别指望用道德绑架让你点头——你只为自己的良心屈膝。",
      "外面看你是软的，内里其实是烧不化的。"
    ],
    character: {
      name: "凯瑟琳·厄恩肖",
      book: "《呼啸山庄》",
      author: "艾米莉·勃朗特",
      year: "1847",
      intro: "她说过那句让文学史为之一震的话：「我就是希斯克利夫。」——不是「我爱他」，是「我是他」。她的爱不是浪漫，是一种融合到骨子里的忠诚。她也许做过错误的选择，但她从未在精神上真正背叛过自己最深处的那个人。她活成了荒原上的风：吹不散、吹不弯、不向任何人解释自己为什么这样。她教会所有女性一件事：有些情感不是用来管理的，是用来燃烧的——哪怕烧掉你，也不改道。",
      link: "你懂那种忠诚，它不讲道理，但它从不撒谎。"
    }
  },
  huangyuanhuo: {
    code: "外·刚·独·进",
    name: "荒原火",
    tagline: "烧不死的命。",
    description: [
      "你是那种「凭什么」挂在嘴边的女性。不是抱怨的凭什么，是挑战的凭什么。",
      "你讨厌被安排，讨厌被低估，讨厌被教做人。你活着的主要方式就是——证伪别人对你的预设。",
      "你不是不怕疼，你是觉得不疼的人生更没意思。"
    ],
    character: {
      name: "斯嘉丽·奥哈拉",
      book: "《飘》",
      author: "玛格丽特·米切尔",
      year: "1936",
      intro: "战争把她的世界烧成灰，丈夫死了、家破了、田里的泥土都带着血——她饿到啃萝卜时对天发誓：「上帝为我作证，我再也不要挨饿了。」然后她从零开始，开木材厂、做生意、养活全家老小。她不是什么完美的女人，她自私、任性、有时候甚至凉薄。但她身上有一样东西是多数人终其一生都练不出来的——她从不让自己做受害者。跌下去了，拍拍土，继续。「毕竟，明天又是新的一天。」",
      link: "你们共享同一种烧不死的命。"
    }
  },
  yinyingyan: {
    code: "外·刚·独·慢",
    name: "银鹰眼",
    tagline: "她是被时代困住的CEO。",
    description: [
      "你是那种坐在会议室里不怎么说话，但一开口就让场子安静的女性。",
      "你信逻辑多过信感情，但你不冷——你只是把温度留给值得的人。",
      "你不喜欢解释自己。你觉得解释本身，就是一种自我矮化。"
    ],
    character: {
      name: "贾探春",
      book: "《红楼梦》",
      author: "曹雪芹",
      year: "十八世纪",
      intro: "大观园里所有的女孩里，她是最像「管理者」的那个。王熙凤生病时，是她代理大观园的事务，刚一上手就搞改革、减冗费、整纪律——雷厉风行得让下人不敢作乱。她出身庶出，在那个讲嫡庶的时代本该低人一头，但她偏偏活得比谁都挺拔。她说：「我但凡是个男人，可以出得去，立一番事业。」她是被时代困住的CEO。她的锋利不是攻击性，是一种「我看得见局势、我知道该怎么办、请别挡我路」的专业感。",
      link: "她生错了年代，但你没有。"
    }
  },
  zhushayin: {
    code: "外·刚·共·进",
    name: "朱砂印",
    tagline: "你的愤怒会变成行动。",
    description: [
      "你是那种「替别人出头」的女性。你见不得不公，你见不得软弱被欺负。",
      "你的愤怒是有用的愤怒，不是情绪——它会变成行动。",
      "你爱得很直白，恨得也很直白。你讨厌暧昧，因为暧昧对你是一种消耗。"
    ],
    character: {
      name: "赫敏·格兰杰",
      book: "《哈利·波特》",
      author: "J.K. 罗琳",
      year: "1997-2007",
      intro: "她是那个在图书馆泡了七年、在三个人的友谊里从不是「被保护的那个」、在关键时刻总能给出正确答案的女孩。她成立S.P.E.W为家养小精灵争取权利——即使所有人都觉得这很好笑。她告诉哈利：「书本！还有——聪明才智！但还有更重要的东西——友情和勇气。」她用行动证明了一件事：知识不是书呆子的装饰，知识是武器；正义感不是幼稚，正义感是一种罕见的肌肉力量。她是一代女孩长大的理由。",
      link: "她打破了「女孩子不适合」的全部前缀——你活出了她长大后的样子。"
    }
  },
  yurenfeng: {
    code: "外·刚·共·慢",
    name: "玉刃锋",
    tagline: "你自己就是定价方。",
    description: [
      "你是那种说话温和但立场清晰的女性。你的「不」字说得很轻，但从不反悔。",
      "你懂人情世故，但你不靠人情世故活着。你更愿意靠一套自己认可的准则。",
      "你不追求被所有人喜欢——你追求被该喜欢你的人喜欢。"
    ],
    character: {
      name: "伊丽莎白·班纳特",
      book: "《傲慢与偏见》",
      author: "简·奥斯汀",
      year: "1813",
      intro: "她拒绝了两次求婚。第一次，对方是牧师柯林斯，娶她意味着她一辈子衣食无忧——她说不。第二次，对方是全英国最抢手的达西先生，年收入一万英镑——她还是说不。她的理由只有一个：「我不会为任何不是真心的原因结婚。」在一个女人没有嫁人就等于没有未来的时代，她守住了自己的判断力。她不是不通人情，她是通透到知道什么值得换、什么不值得换。她的聪明不是刻薄，是一种温柔的清醒——她自己就是定价方，她不接受任何人给她估价。",
      link: "她教会了两百年的女性：你可以又可爱，又不让步。"
    }
  },
  liuyunying: {
    code: "内·柔·独·慢",
    name: "流云影",
    tagline: "你从不需要通过赢别人来证明自己。",
    description: [
      "你是那种「看起来没有攻击性，其实没人真的动得了你」的女性。",
      "你不与世界为敌，也不为世界改变。你只是安静地活成自己想要的形状。",
      "你的力量在于——你从不需要通过赢别人来证明自己。"
    ],
    character: {
      name: "薇奥拉",
      book: "《第十二夜》",
      author: "威廉·莎士比亚",
      year: "约1601",
      intro: "船难让她流落异乡，一无所有。她没有哭诉，没有求助，而是剪短头发、换上男装，改名「西萨里奥」，进入公爵府当侍从——独自重新建立自己的生活。她爱上了公爵，但公爵派她去向别的女人求爱。她咽下去，照做——因为她知道有些爱说出口就会打碎整个局面，而她选择保住那个局面。最后，当一切真相大白，她优雅地走回女性身份，不带怨、不带伤。她是莎士比亚笔下最会「在变形中保持自己」的女性：她可以扮演任何角色，但从不迷失于任何角色。",
      link: "在流离中不失轻盈，在扮演中不丢自己——这是一种很高级的稳。"
    }
  },
  taihenting: {
    code: "内·柔·独·进",
    name: "苔痕庭",
    tagline: "你是在没人看见的地方，悄悄把自己造出来的。",
    description: [
      "你看着像是岁月静好，其实你在默默长。像苔，不争阳光，却把整面墙爬成了风景。",
      "你不说「我要」，你直接就「做了」。你的进步是沉默的，但从不停。",
      "你讨厌被催，但你从不让自己停下。"
    ],
    character: {
      name: "乔·马奇",
      book: "《小妇人》",
      author: "露易莎·梅·奥尔科特",
      year: "1868",
      intro: "她在家里的阁楼上，一个字一个字地写小说。她拒绝了劳里的求婚——那个所有人都觉得完美的男孩——因为她知道自己要的不是婚姻，是书桌。她短发、穿旧衣服、跑步、大笑、不打算优雅。她说：「我不愿意说我宁愿没有结婚，但我真的是更想写作。」在一个女人的价值只用婚姻衡量的年代，她为自己挖了第二条路——安静地、倔强地、一个人走。她没有轰轰烈烈地反抗，她只是一直在写。",
      link: "她是在没人看见的地方，悄悄把自己造出来的——你也是。"
    }
  },
  nuanchayan: {
    code: "内·柔·共·慢",
    name: "暖茶烟",
    tagline: "这世上最被低估的力量，叫温柔。",
    description: [
      "你是那种「让人愿意把秘密交给你」的女性。你听得进去，也放得下去。",
      "你的温柔不是没脾气，是你比脾气更有耐心。",
      "你知道怎么在一片嘈杂里给别人留一寸静，也给自己留一寸。"
    ],
    character: {
      name: "梅兰妮·汉密尔顿",
      book: "《飘》",
      author: "玛格丽特·米切尔",
      year: "1936",
      intro: "在一本以斯嘉丽的野火为主角的书里，她是那束安静的灯。所有人都以为她软弱——她身材单薄、说话温柔、从不与人争。但真正的考验来临时，是她拿起军刀守在斯嘉丽身边；是她在全镇都鄙视斯嘉丽时，站出来为她辩护；是她临终前拉着斯嘉丽的手说「照顾好阿希礼」。她的柔软从来不是软弱，是一种深到骨子里的信——对人的信、对爱的信、对善的信。斯嘉丽用了一整本书的时间才明白：真正强的那个人，一直是梅兰妮。",
      link: "这世上最被低估的力量，叫温柔。"
    }
  },
  yanxialing: {
    code: "内·柔·共·进",
    name: "檐下铃",
    tagline: "条件再差也能开花的人。",
    description: [
      "你是那种「在生活的缝里种花」的女性。你不轰轰烈烈，但你不放弃热爱。",
      "你敏感，但你不脆弱——你只是把感受转化成了创造。",
      "你懂很多人的难，因为你自己走过很多难。但你没有把这些变成刺，而是变成了光。"
    ],
    character: {
      name: "弗朗西·诺兰",
      book: "《布鲁克林有棵树》",
      author: "贝蒂·史密斯",
      year: "1943",
      intro: "她生在一个穷到要一分钱掰两半花的家庭。她父亲酗酒、早逝，她母亲偏爱弟弟，她每天在垃圾场捡废品换钱。但她有一棵树——从水泥缝里长出来的那种树，怎么砍都砍不死。她用图书馆读完了所有能借到的书，她偷偷写下自己看到的一切，她用文字把贫瘠的生活变成了一片可以呼吸的森林。她教会所有人一件事：土壤的条件可以很差，但种子是你自己的。她后来活出了自己想要的样子——不是靠谁救她，是靠她救自己。",
      link: "在贫瘠里开出花的人，懂得什么是真正的丰盛。"
    }
  },
  bailuyu: {
    code: "外·柔·独·进",
    name: "白鹭羽",
    tagline: "一边笑一边走自己的路。",
    description: [
      "你是那种「一边笑一边走自己的路」的女性。你不激烈，但你不停。",
      "你用轻盈做武器。别人以为你好说话，其实你只是不想在小事上较劲。",
      "重要的事，你从不商量。"
    ],
    character: {
      name: "斯科特·芬奇",
      book: "《杀死一只知更鸟》",
      author: "哈珀·李",
      year: "1960",
      intro: "她是一个六岁的小女孩，穿工装裤、打架、爬树、不肯穿裙子。整个小镇的大人都觉得这个小女孩「不像样」。但她有一双最清澈的眼睛——她看得见种族主义的荒谬，她看得见邻居的善，她看得见父亲在法庭上为一个黑人辩护时的孤独。她不懂大人的那些弯弯绕绕，她只问：「为什么？这不公平。」她用孩童的直，刺穿了成人世界精心粉饰的荒唐。她长大后一定会变成那种「不合时宜但永远正确」的女人——我们都需要这样的人。",
      link: "你保有的，是她长大后仍没丢的那份清澈。"
    }
  },
  yinhedu: {
    code: "外·柔·独·慢",
    name: "银河渡",
    tagline: "热闹是表演，独行才是回家。",
    description: [
      "你是那种「在人群里也像一个人走」的女性。你合群，但你不属于任何群。",
      "你温柔地保留着距离，不让任何人太近，也不让自己太远。",
      "你相信每个人都有自己的轨道，而你只负责把自己那颗星走好。"
    ],
    character: {
      name: "克拉丽莎·达洛维",
      book: "《达洛维夫人》",
      author: "弗吉尼亚·伍尔夫",
      year: "1925",
      intro: "整本书只写了她一天——为一场派对买花、回家、见老朋友、主持派对。但在这一天里，她走过了自己的整个人生。她选了一个体面但不热烈的丈夫，拒绝了那个真正懂她的男人，她知道自己错过了什么，但她不后悔——因为她守住了一个女人最珍贵的东西：自己的完整。她不需要被任何人占有，哪怕是以爱为名。她在人群中走着，优雅、得体、孤独，她享受这种孤独。她懂得一件很多女性一生都学不会的事：热闹是表演，独行才是回家。",
      link: "在一场派对里走完半生的风景——你懂那种热闹里的独行。"
    }
  },
  chunritao: {
    code: "外·柔·共·进",
    name: "春日绦",
    tagline: "把每一天都当成值得的那一天。",
    description: [
      "你是那种「走进一个房间就让气氛暖起来」的女性。你有热度，但你不灼人。",
      "你爱得大方，也敢被爱。你不怕表达，也不怕被拒绝。",
      "你的能量来自于「我愿意」，而不是「我必须」。"
    ],
    character: {
      name: "安妮·雪莉",
      book: "《绿山墙的安妮》",
      author: "露西·莫德·蒙哥马利",
      year: "1908",
      intro: "她是一个被领养错的孤儿——绿山墙农场本来想要一个男孩，来了一个红头发、满脸雀斑、话多到停不下来的女孩。她会把一条普通的小路叫「情人小径」，把一棵樱花树叫「白雪皇后」，把每一天都活成一首诗。她犯过无数错，闹过无数笑话，但她从不让世界的冷磨掉她眼睛里的光。她是一种罕见的天赋的代名词——把平淡活成闪光的能力。她长大以后当了老师、作家、妻子、母亲，但她最厉害的身份始终是：那个永远保有想象力的女孩。",
      link: "有些人的天赋，是把每一天都当成值得的那一天。"
    }
  },
  fanhuating: {
    code: "外·柔·共·慢",
    name: "繁花庭",
    tagline: "深情是一种终生的能力。",
    description: [
      "你是那种「家里灯永远是亮的」的女性。你知道怎么让一个空间、一段关系、一顿饭有呼吸感。",
      "你温柔，但你不讨好。你付出，但你不消耗自己。",
      "你相信细水长流，不是因为你没激情，是因为你比谁都更懂激情的保质期。"
    ],
    character: {
      name: "娜塔莎·罗斯托娃",
      book: "《战争与和平》",
      author: "列夫·托尔斯泰",
      year: "1869",
      intro: "她是那个在第一次舞会上让所有人侧目的少女——不是因为她最美，是因为她活得最满。她爱安德烈公爵时爱得不顾一切，她犯错时也犯得坦坦荡荡，她在战争年代守着受伤的士兵像守着自己的家人。托尔斯泰让她从一个明亮的少女，变成一个丰腴的母亲——有人说她「陷落」了，失去了光芒。但懂她的人知道：她只是把那束光，从少女的外放，收进了一生的深情里。她教会所有女性：深情不是少女的专利，深情是一种终生的能力。",
      link: "她从少女的热烈长成母亲的温厚，一路都没丢掉对生活的深情——你也是。"
    }
  }
};

function codeToPersona(I, II, III, IV) {
  const axis1 = I < 0 ? "内" : "外";
  const axis2 = II < 0 ? "柔" : "刚";
  const axis3 = III < 0 ? "独" : "共";
  const axis4 = IV < 0 ? "慢" : "进";
  const code = `${axis1}·${axis2}·${axis3}·${axis4}`;
  for (const key in PERSONAS) {
    if (PERSONAS[key].code === code) return { key, ...PERSONAS[key] };
  }
  return null;
}

// ============ 数据：20道题 ============
const QUESTIONS = [
  { id: 1, type: "形而上", question: "你觉得自己的灵魂是什么形状？", options: [
    { text: "温润的椭圆，没有尖锐的棱角，却有清晰的轮廓，藏着柔软与坚定，像被岁月打磨过的玉，沉默却有力量", scoring: [-1, -1, 1, -1] },
    { text: "舒展的星芒，棱角分明却不锋利，每一道光芒都指向不同的热爱，自由而热烈，自带照亮自己的光", scoring: [2, 1, -1, 2] },
    { text: "流动的波纹，没有固定的形态，能顺应境遇舒展，也能守住内心的底色，温柔却不怯懦，通透而从容", scoring: [1, -1, 1, -1] },
    { text: "沉稳的方形，有明确的边界与坚守，不轻易妥协，不随意将就，每一面都藏着清醒与自持，踏实而有力量", scoring: [-2, 1, -1, 0] }
  ]},
  { id: 2, type: "锋利", question: "你路过一个房间，听见有人正在说你——他不知道你在，他用一种你知道不是真相的方式描述着你。那一刻，你会？", options: [
    { text: "推门走进去，当场把事实放回原位：「你刚刚说的那段，我这里有另一个版本。」——有些叙事，不当场拿回来，就被别人定型了", scoring: [1, 2, -1, 2] },
    { text: "不走进去，也不惊动谁。但我心里清清楚楚——这个人从此不在我会认真对待的人里", scoring: [-2, 1, -1, -1] },
    { text: "站那儿停了几秒，认真想——他说的是否有哪怕一点点我没意识到的真实？然后告诉自己：就算有，他的说法不是我的定义", scoring: [-1, 0, -1, 0] },
    { text: "不会当场戳穿，但会找合适的场合、合适的人，让真实的版本自己传出去——比直接反驳更管用", scoring: [2, -3, 3, -1] }
  ]},
  { id: 3, type: "形而上", question: "在安静听歌时，你会不自觉幻想什么场景？", options: [
    { text: "暮色四合的露台，晚风裹着草木的香气，身后是暖黄的灯光，身前是漫天星光，孤独却不孤单", scoring: [-1, 1, -1, -1] },
    { text: "雨后的林间小径，石板路带着湿润的光泽，旋律与雨声交织，只有自己与天地的温柔共鸣", scoring: [-1, -1, 1, -1] },
    { text: "洒满阳光的书桌前，窗外有飞鸟掠过，那些未说出口的心事，都化作文字", scoring: [-1, -1, 1, 1] },
    { text: "空旷的海边，浪潮漫过沙滩，所有的浮躁与焦虑都被海风带走，只剩内心的平静与自由", scoring: [3, 1, -1, 1] }
  ]},
  { id: 4, type: "锋利", question: "你在一个重要场合被人公开贬低——某个男性说了一句「女生搞这个不太行」，全场安静地看着你。下一秒你会？", options: [
    { text: "坦然看向对方，语气平淡地回：既然你这么笃定，不如我们当场把成果、思路逐条对比看看。", scoring: [2, 2, 1, 2] },
    { text: "神色没有丝毫波澜，继续自己的发言，全程不再分给他一丝目光，言语与实力自会证明一切，不屑口舌之争。", scoring: [1, 2, -2, -1] },
    { text: "淡淡笑了一下，轻描淡写回一句：原来你的认知，还停留在靠性别定义能力的阶段。 说完便自然衔接发言，稳住全场节奏。", scoring: [2, -2, 2, 1] },
    { text: "当场不回应，事后找到对的方式让他为这句话买单——有些仗不在嘴上打", scoring: [-5, -2, -1, -2] }
  ]},
  { id: 5, type: "形而上", question: "你认为，灵魂的底色是由什么构成的？", options: [
    { text: "过往的沉淀与坚守，那些走过的路、经历的事，一点点勾勒出灵魂的模样", scoring: [-1, 1, -1, -2] },
    { text: "心底的热爱与纯粹，无论历经多少世事，依然保留着对生活的热忱", scoring: [2, 1, -1, 2] },
    { text: "清醒的认知与接纳，接纳自己的不完美，看清生活的真相，依然选择温柔以待", scoring: [0, -1, -1, -1] },
    { text: "无声的共情与善意，懂得体谅他人的难处，也懂得善待自己", scoring: [-1, -1, 3, 1] }
  ]},
  { id: 6, type: "锋利", question: "你知道了一个关于你自己的、并不好听的传言，而且传播的人是一个你以为是朋友的人。你会？", options: [
    { text: "直接当面质问她——关系可以断，但账要算清。你不允许背后的刀扎进来还不出声", scoring: [2, 2, 1, 2] },
    { text: "不找她对质，但从此收回所有对她的信任——有些人不值得你浪费一场争吵", scoring: [-2, 1, -2, -1] },
    { text: "先冷静分析她为什么这么做，也许背后有我不知道的误会；给一次对话的机会，但只一次", scoring: [-1, -1, 2, 1] },
    { text: "把精力放在比这更重要的事上——谣言会自己消散，你没必要为不重要的人停下脚步", scoring: [1, -2, -1, -2] }
  ]},
  { id: 7, type: "形而上", question: "你心中的「精神栖息地」，是什么模样？", options: [
    { text: "一间摆满书籍与绿植的小屋，能安静地读书、思考、发呆，远离外界的喧嚣", scoring: [-2, -1, -1, -1] },
    { text: "一片无拘无束的原野，能肆意奔跑、肆意呐喊，找回最本真的自己", scoring: [2, 2, -1, 2] },
    { text: "一个无人打扰的角落，有自己热爱的事物相伴，沉浸其中忘记时间", scoring: [-1, -1, -1, 1] },
    { text: "一段无需多言的陪伴，哪怕沉默静坐，也能感受到温暖与安心", scoring: [1, 0, 3, -2] }
  ]},
  { id: 8, type: "锋利", question: "你曾经拼尽全力做过一件事——一个项目、一份工作、一段努力——后来发现它根本配不上你那样认真。回头看，你心里想的是？", options: [
    { text: "没什么可后悔的，那时候的我值得那份认真——是那件事不配，不是我的问题", scoring: [1, 2, -1, 1] },
    { text: "那段经历让我看清了自己的底线，以后再也不会把全部押在一个没想清楚的地方了", scoring: [-2, 1, -2, 1] },
    { text: "谢谢那个曾经愿意用力去拼的自己——这种能力比那件事值不值得重要得多", scoring: [-1, 1, 2, -1] },
    { text: "已经不太想起了，走过的路是走过的风景，我现在在新的赛道上", scoring: [2, -4, 1, -1] }
  ]},
  { id: 9, type: "形而上", question: "如果时光能与过去的自己对话，你会递出一句什么样的隐喻？", options: [
    { text: "你是破土的新芽，那些扎根的时光，都会成为你未来向上生长的力量", scoring: [1, 1, 1, 2] },
    { text: "你是檐下的风铃，风来自然鸣，风去亦从容，守住自己的节奏便是最好的模样", scoring: [1, -1, 1, -2] },
    { text: "你是掌心的微光，哪怕微弱，也能照亮自己的路，那些坚持终会绽放光芒", scoring: [-2, 1, -1, 1] },
    { text: "你是山间的溪流，蜿蜒曲折皆是风景，慢慢走，终会遇见属于自己的辽阔", scoring: [0, -1, -1, -1] }
  ]},
  { id: 10, type: "锋利", question: "你的朋友半开玩笑地说：「我发现你这个人吧——有点不太合群。」说完还笑了笑，意思是「无恶意提醒」。你心里真正的反应是？", options: [
    { text: "我会直接说：「不合群是因为群不够有意思。不是所有圈子都值得我调频。」把这个词的方向反过来", scoring: [2, 2, 1, 1] },
    { text: "我听出来她说的「不合群」其实是「不像她希望的那样」——这不是我的问题，是她对「一起」的定义太窄了", scoring: [-1, 2, -2, 1] },
    { text: "我不辩解。合群与否不是我用来衡量自己的指标，她说什么不会改变我怎么活", scoring: [-2, -1, -1, -1] },
    { text: "笑一下就过了——这种半开玩笑的评价不值得我认真接。我有更重要的事要做", scoring: [1, -3, 2, -1] 
  ]},
  { id: 11, type: "形而上", question: "你认为，「自我」是在什么时刻得以完整的？", options: [
    { text: "在接纳自己的所有不完美时，与自己的每一面和平相处", scoring: [-1, -1, 1, -2] },
    { text: "在坚守自己的热爱与追求时，哪怕独行，也能坚定地走下去", scoring: [-1, 2, -2, 2] },
    { text: "在学会与孤独和解时，能在独处中找到自我价值，让灵魂得以沉淀", scoring: [-1, 1, -2, -1] },
    { text: "在懂得爱与被爱时，不依附、不索取，以平等的姿态奔赴每一段关系", scoring: [3, -2, 3, 1] }
  ]},
  { id: 12, type: "锋利", question: "一个光鲜的机会摆在你面前——大厂offer、保研名额、被看好的晋升——所有人都说你该答应，家人、朋友、甚至你自己的理智。但你心里就是没那种「就是它」的感觉。你怎么办？", options: [
    { text: "拒绝。没感觉就是没感觉，别人眼里的光鲜，不等于我想走的路", scoring: [-1, 3, -1, 2] },
    { text: "再观察一段时间——不马上拒绝，但也不勉强自己去接受，时间会告诉我答案", scoring: [-1, -2, -1, -2] },
    { text: "坦诚告诉对方：「这个机会很好，但不适合此刻的我。」不拖延别人，也不欺骗自己", scoring: [3, 1, 2, -1] },
    { text: "问自己一个问题：我是真的不想要，还是害怕自己配得上这样的好？想清楚再做决定", scoring: [-1, -2, 0, 1] }
  ]},
  { id: 13, type: "锋利", question: "你已经三十多岁，没结婚，没孩子，有自己的事业但也不是什么大成就。亲戚聚会时有人问你「你这样到底图什么」。你内心真实的回答是？", options: [
    { text: "我图我每一天都是我自己选的，不是被塞进去的。光这一点，就值得", scoring: [-1, 1, 1, 2] },
    { text: "我不欠任何人一个交代——我活着不是为了回答这个问题", scoring: [2, 3, -1, -1] },
    { text: "我图的东西你听不懂——自由、清醒、一个自己说了算的人生。这些你们的词典里没有", scoring: [-1, 0, -2, -1] },
    { text: "我没什么「图」的，我只是在按自己的节奏活着——有的人很快走完一生，有的人慢慢来", scoring: [0, -4, 2, 0] }
  ]},
   { id: 14, type: "锋利", question: "你发现身边有一个女性朋友正在被她的伴侣温柔地、看不见地消耗——她没意识到，但你看得一清二楚。你会怎么做？", options: [
    { text: "直接跟她说清楚，哪怕她现在不想听，哪怕会短期伤害友谊。有些话，朋友不说就没人说了", scoring: [1, 2, 1, 2] },
    { text: "不直接戳破，但用行动让她慢慢看见，多陪她做让她感到自己的事，一点点把她拉出来", scoring: [-1, 1, 2, 1] },
    { text: "只在她主动问我的时候才说真话——她有她自己的节奏，我不能替她决定什么时候醒", scoring: [-1, -1, -1, -1] },
    { text: "留一个随时接应她的位置——不催、不劝、不评判，等她愿意走出来的那天，我在", scoring: [1, -2, -2, -2] }
  ]},
  { id: 15, type: "锋利", question: "你照镜子，发现自己有了第一根白头发、第一道细纹。那一瞬间你心里真正的声音是？", options: [
    { text: "一种奇怪的踏实感——我正在变成一个有故事的人，不再是那个等着被定义的女孩了", scoring: [-1, 1, 1, -2] },
    { text: "有一点点失落，但更多是好奇——我开始想知道，五十岁、六十岁的我，会是什么样子的", scoring: [1, -1, 1, 2] },
    { text: "无所谓。女性的年龄焦虑是被塑造出来的，我不吃这一套——细纹就细纹，那是我笑出来的", scoring: [1, 2, -1, -1] },
    { text: "认真地看了看自己，然后想：我要怎么让接下来的每一年，都对得起这张脸上的每一条痕迹？", scoring: [-1, -2, -1, 1] }
  ]},
  { id: 16, type: "场景化", question: "你更倾向于哪种相处模式（无论是友情还是爱情）？", options: [
    { text: "势均力敌，彼此独立，既能并肩前行一起成长，也能各自发光", scoring: [1, 2, -2, 2] },
    { text: "温柔相伴，彼此包容，哪怕沉默静坐也能心意相通", scoring: [-2, -2, 2, -1] },
    { text: "坦诚相待，有话直说，哪怕有矛盾也能及时沟通，不冷战不内耗", scoring: [2, 1, 0, 1] },
    { text: "灵魂同频，一个眼神就能懂对方的心思，彼此理解、彼此滋养", scoring: [-1, -1, 0, -2] }
  ]},
  { id: 17, type: "锋利", question: "一个你本以为属于自己的机会——升职、主导项目、重要评优——被给了一个明显不如你的同事。你怎么消化这件事？", options: [
    { text: "那就说明决策的人不懂我的价值——这个结果证明了这里不值得我再耗下去，是他们的损失", scoring: [1, 3, -1, -1] },
    { text: "这种事不是能力的比较题，他们选了她，不一定是因为她更强，是因为当下这里需要一个她那样的人——我不用从自己身上找原因", scoring: [-1, -1, 2, -1] },
    { text: "这件事提醒了我：等一个结构自己认出你，是这世界上最不划算的事情之一。以后我要把赌注押在看得见我的地方", scoring: [1, 1, 1, 3] },
    { text: "有短暂的不甘，但很快过去——我没输给谁，我只是没被选中。我的价值不由某一次评判来确认", scoring: [-1, -3, -2, -1] }
  ]},
  { id: 18, type: "形而上", question: "你觉得，「自由」对你而言，是什么模样？", options: [
    { text: "灵魂的自由，不被世俗标准绑架，哪怕不被理解，也能坚定地走自己的路", scoring: [-1, 2, -2, 2] },
    { text: "心境的自由，不内耗不焦虑，既能享受繁华，也能安于平淡", scoring: [-2, -1, 1, -2] },
    { text: "选择的自由，有能力拒绝不喜欢的，有勇气追求热爱的，不勉强不妥协", scoring: [2, 1, -1, 1] },
    { text: "相处的自由，能在关系中保持自我，彼此尊重，互不捆绑", scoring: [1, -2, 2, -1] }
  ]},
  { id: 19, type: "场景化", question: "当你需要做出一个重大决定，你会怎么选择？", options: [
    { text: "听从自己的内心，哪怕未来有风险，也不后悔自己的选择", scoring: [-1, 2, -1, 2] },
    { text: "综合利弊，参考身边人的建议，谨慎思考后再做决定", scoring: [2, -1, 1, -1] },
    { text: "先犹豫一段时间，观察事态发展，等思路清晰后再做选择", scoring: [-2, 1, 1, -2] },
    { text: "相信自己的直觉，同时做好最坏的打算，勇敢迈出第一步", scoring: [1, -2, -1, 1] }
  ]},
  { id: 20, type: "形而上", question: "你认为，幸福的本质是什么？", options: [
    { text: "自我价值的实现，能做自己喜欢的事，成为自己想成为的人", scoring: [1, 2, -1, 2] },
    { text: "内心的平静与自在，不内耗不焦虑，知足常乐，温柔向阳", scoring: [1, -1, -1, -2] },
    { text: "身边的温暖与陪伴，有家人守护、朋友真诚，感受生活的暖意", scoring: [-1, -2, 3, -1] },
    { text: "与世界的温柔相拥，懂得感恩珍惜，活在当下，不负热爱", scoring: [-1, 1, -1, 1] }
  ]}
];

function calculateResult(answers) {
  let I = 0, II = 0, III = 0, IV = 0;
  answers.forEach((optIdx, qIdx) => {
    const s = QUESTIONS[qIdx].options[optIdx].scoring;
    I += s[0]; II += s[1]; III += s[2]; IV += s[3];
  });
  return { I, II, III, IV, persona: codeToPersona(I, II, III, IV) };
}

// ============ 设计 Token ============
const theme = {
  paper: "#F5EFE4",
  paperDark: "#EBE4D5",
  ink: "#1A1612",
  inkSoft: "#3E362D",
  inkMuted: "#6B6358",
  inkFaint: "#9A9085",
  accent: "#8B2820",
  accentSoft: "#A84A3E",
  gold: "#A68547",
  line: "#D4C9B5"
};

// ============ 工具组件 ============
const Ornament = ({ className = "" }) => (
  <svg viewBox="0 0 120 10" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="0" y1="5" x2="45" y2="5" stroke="currentColor" strokeWidth="0.5" />
    <circle cx="52" cy="5" r="1" fill="currentColor" />
    <path d="M 60 2 L 60 8 M 57 5 L 63 5" stroke="currentColor" strokeWidth="0.5" />
    <circle cx="68" cy="5" r="1" fill="currentColor" />
    <line x1="75" y1="5" x2="120" y2="5" stroke="currentColor" strokeWidth="0.5" />
  </svg>
);

// ============ 主页 ============
function HomePage({ onStart }) {
  return (
    <div className="min-h-screen flex flex-col px-8 py-12 relative" style={{ background: theme.paper }}>
      <div className="flex-1 flex flex-col justify-between">
        {/* 顶部标识 */}
        <div className="pt-8">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 flex items-center justify-center text-[11px] tracking-widest"
              style={{
                background: theme.accent,
                color: theme.paper,
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic"
              }}
            >
              x
            </div>
            <div
              className="text-[10px] tracking-[0.35em] uppercase"
              style={{ color: theme.inkMuted, fontFamily: "'Cormorant Garamond', serif" }}
            >
              xxti · 2026
            </div>
          </div>
        </div>

        {/* 标题 + 文案 */}
        <div className="py-8 space-y-10">
          {/* 英文小标 */}
          <div
            className="text-[11px] tracking-[0.4em] uppercase opacity-70"
            style={{ color: theme.accent, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}
          >
            — a literary mirror for her —
          </div>

          {/* 主标题 */}
          <h1
            className="leading-[1.15] tracking-tight"
            style={{
              fontFamily: "'Noto Serif SC', 'Songti SC', serif",
              color: theme.ink,
              fontSize: "2.25rem",
              fontWeight: 500
            }}
          >
            你读过的那些<br />
            <span className="inline-block relative">
              女主角
              <span
                className="absolute -bottom-1 left-0 right-0 h-[2px]"
                style={{ background: theme.accent }}
              />
            </span>
            ，<br />
            其实都是你。
          </h1>

          <Ornament className="w-32 -ml-1" style={{ color: theme.line }} />

          {/* 副文 */}
          <div
            className="space-y-5 text-[15px] leading-[2]"
            style={{ color: theme.inkSoft, fontFamily: "'Noto Serif SC', serif" }}
          >
            <p>
              我们从几百年的女性书写里，
              <br />
              为你找出那一位——
            </p>
            <p style={{ color: theme.ink }}>
              她写过你没来得及说出口的话，
              <br />
              她活过你正在活的日子。
            </p>
            <p>
              一个在文学里爱过、痛过、挣扎过的灵魂，
              <br />
              在这里等你认领她，也被她认领。
            </p>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="pb-4 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: theme.line }} />
            <div
              className="text-[10px] tracking-[0.3em]"
              style={{ color: theme.inkMuted, fontFamily: "'Cormorant Garamond', serif" }}
            >
              XX · our · power
            </div>
            <div className="flex-1 h-px" style={{ background: theme.line }} />
          </div>

          <button
            onClick={onStart}
            className="w-full py-5 relative group transition-all active:scale-[0.98]"
            style={{
              background: theme.ink,
              color: theme.paper,
              fontFamily: "'Noto Serif SC', serif",
              letterSpacing: "0.2em"
            }}
          >
            <span className="text-sm">开 始 认 领</span>
            <span
              className="absolute top-2 left-2 right-2 bottom-2 pointer-events-none"
              style={{ border: `1px solid ${theme.paper}`, opacity: 0.25 }}
            />
          </button>

          <p
            className="text-[11px] text-center tracking-wider"
            style={{ color: theme.inkFaint, fontFamily: "'Noto Serif SC', serif" }}
          >
            二十道题，约五分钟　·　十六种灵魂，一面镜子
          </p>
        </div>
      </div>
    </div>
  );
}

// ============ 题目页 ============
function QuestionPage({ qIdx, answers, onAnswer, onBack }) {
  const q = QUESTIONS[qIdx];
  const selected = answers[qIdx];
  const [fading, setFading] = useState(false);
  const scrollRef = useRef(null);

  // 每进入新题，重置滚动
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [qIdx]);

  const handleSelect = (optIdx) => {
    if (fading) return;
    setFading(true);
    setTimeout(() => {
      onAnswer(optIdx);
      setFading(false);
    }, 320);
  };

  const progress = ((qIdx + 1) / QUESTIONS.length) * 100;

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: theme.paper }}
    >
      {/* 顶部进度 */}
      <div className="px-7 pt-10 pb-6 space-y-3" style={{ background: theme.paper }}>
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            disabled={qIdx === 0}
            className="flex items-center gap-2 text-[11px] tracking-widest transition-opacity disabled:opacity-20"
            style={{ color: theme.inkMuted, fontFamily: "'Cormorant Garamond', serif" }}
          >
            <span style={{ fontSize: "14px" }}>←</span>
            <span>BACK</span>
          </button>
          <div
            className="text-[10px] tracking-[0.3em]"
            style={{ color: theme.inkMuted, fontFamily: "'Cormorant Garamond', serif" }}
          >
            Q.{String(q.id).padStart(2, "0")} / {String(QUESTIONS.length).padStart(2, "0")}
          </div>
        </div>

        {/* 进度条：像书页翻阅 */}
        <div className="relative h-[2px]" style={{ background: theme.line }}>
          <div
            className="absolute top-0 left-0 h-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%`, background: theme.accent }}
          />
        </div>
      </div>

      {/* 题目内容区 */}
      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto px-7 pb-10 transition-opacity duration-300 ${
          fading ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* 题干 */}
        <h2
          className="text-[20px] leading-[1.6] font-medium mb-8 mt-2 tracking-tight"
          style={{
            fontFamily: "'Noto Serif SC', serif",
            color: theme.ink
          }}
        >
          {q.question}
        </h2>

        <Ornament className="w-24 mb-8" style={{ color: theme.line }} />

        {/* 选项 */}
        <div className="space-y-4">
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className="w-full text-left relative transition-all duration-300 active:scale-[0.99]"
                style={{
                  background: isSelected ? theme.ink : theme.paperDark,
                  color: isSelected ? theme.paper : theme.inkSoft,
                  padding: "20px 22px 22px",
                  borderRadius: "2px"
                }}
              >
                {/* 选项字母 */}
                <div className="flex items-start gap-4">
                  <div
                    className="flex-shrink-0 mt-[2px]"
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: "italic",
                      fontSize: "22px",
                      color: isSelected ? theme.paper : theme.accent,
                      opacity: isSelected ? 0.6 : 1,
                      lineHeight: 1
                    }}
                  >
                    {"abcd"[i]}
                  </div>
                  <p
                    className="text-[14px] leading-[1.9] flex-1"
                    style={{ fontFamily: "'Noto Serif SC', serif" }}
                  >
                    {opt.text}
                  </p>
                </div>

                {/* 选中边框动画 */}
                {isSelected && (
                  <span
                    className="absolute top-[6px] left-[6px] right-[6px] bottom-[6px] pointer-events-none"
                    style={{ border: `1px solid ${theme.paper}`, opacity: 0.2 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* 提示 */}
        <p
          className="text-center text-[11px] mt-10 tracking-wider"
          style={{ color: theme.inkFaint, fontFamily: "'Noto Serif SC', serif" }}
        >
          {qIdx === QUESTIONS.length - 1 ? "— 最后一题，为自己诚实地选 —" : "— 选择即下一题，可返回修改 —"}
        </p>
      </div>
    </div>
  );
}

// ============ 计算动画页 ============
function CalculatingPage() {
  const phrases = [
    "在翻检她们的信件……",
    "在对照她们的眼神……",
    "在打开属于你的那一页……"
  ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIdx((i) => (i + 1) % phrases.length), 900);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-10"
      style={{ background: theme.paper }}
    >
      {/* 翻页动画 */}
      <div className="relative w-24 h-24 mb-10">
        <div
          className="absolute inset-0 border animate-spin"
          style={{ borderColor: theme.line, borderTopColor: theme.accent, animationDuration: "2s" }}
        />
        <div
          className="absolute inset-3 flex items-center justify-center"
          style={{
            color: theme.accent,
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: "32px"
          }}
        >
          x
        </div>
      </div>

      <div
        className="text-[13px] tracking-[0.2em] text-center min-h-[24px] transition-opacity duration-300"
        style={{ color: theme.inkSoft, fontFamily: "'Noto Serif SC', serif" }}
      >
        {phrases[idx]}
      </div>
    </div>
  );
}

// ============ 结果页 ============
function ResultPage({ result, onRetake }) {
  const persona = result.persona;
  const [tab, setTab] = useState("result"); // result | comments
  const [revealPhase, setRevealPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setRevealPhase(1), 200);
    const t2 = setTimeout(() => setRevealPhase(2), 800);
    const t3 = setTimeout(() => setRevealPhase(3), 1400);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
    };
  }, []);

  if (!persona) {
    return <div style={{ padding: 40, color: theme.ink }}>结果计算异常，请重试。</div>;
  }

  return (
    <div className="min-h-screen" style={{ background: theme.paper }}>
      {/* Tab 切换 */}
      <div
        className="sticky top-0 z-10 px-6 pt-7 pb-4"
        style={{ background: theme.paper, borderBottom: `1px solid ${theme.line}` }}
      >
        <div className="flex gap-8">
          <button
            onClick={() => setTab("result")}
            className="relative pb-2 text-[13px] tracking-[0.15em]"
            style={{
              color: tab === "result" ? theme.ink : theme.inkFaint,
              fontFamily: "'Noto Serif SC', serif",
              fontWeight: tab === "result" ? 500 : 400
            }}
          >
            你 的 结 果
            {tab === "result" && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ background: theme.accent }}
              />
            )}
          </button>
          <button
            onClick={() => setTab("comments")}
            className="relative pb-2 text-[13px] tracking-[0.15em]"
            style={{
              color: tab === "comments" ? theme.ink : theme.inkFaint,
              fontFamily: "'Noto Serif SC', serif",
              fontWeight: tab === "comments" ? 500 : 400
            }}
          >
            灵 魂 留 言
            {tab === "comments" && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ background: theme.accent }}
              />
            )}
          </button>
        </div>
      </div>

      {tab === "result" ? (
        <ResultContent persona={persona} revealPhase={revealPhase} onRetake={onRetake} />
      ) : (
        <CommentsPanel persona={persona} />
      )}
    </div>
  );
}

function ResultContent({ persona, revealPhase, onRetake }) {
  return (
    <div className="px-7 pt-8 pb-16">
      {/* 编码 */}
      <div
        className={`transition-all duration-700 ${revealPhase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
      >
        <div
          className="text-[10px] tracking-[0.4em] mb-1"
          style={{ color: theme.inkMuted, fontFamily: "'Cormorant Garamond', serif" }}
        >
          YOUR TYPE — {persona.key.toUpperCase()}
        </div>
        <div
          className="text-[11px] tracking-[0.3em]"
          style={{ color: theme.accent, fontFamily: "'Noto Serif SC', serif" }}
        >
          {persona.code}
        </div>
      </div>

      {/* 人格名 */}
      <div
        className={`mt-5 transition-all duration-700 delay-200 ${revealPhase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
      >
        <h1
          className="leading-none tracking-[0.05em]"
          style={{
            fontFamily: "'Noto Serif SC', serif",
            color: theme.ink,
            fontSize: "68px",
            fontWeight: 500
          }}
        >
          {persona.name}
        </h1>
      </div>

      {/* 金句 */}
      <div
        className={`mt-6 transition-all duration-700 delay-500 ${revealPhase >= 2 ? "opacity-100" : "opacity-0"}`}
      >
        <p
          className="text-[15px] leading-[1.7] italic"
          style={{
            color: theme.accent,
            fontFamily: "'Noto Serif SC', serif"
          }}
        >
          「{persona.tagline}」
        </p>
      </div>

      <Ornament className="w-24 mt-8 mb-8" style={{ color: theme.line }} />

      {/* 描述三句 */}
      <div
        className={`space-y-5 transition-all duration-700 delay-700 ${revealPhase >= 2 ? "opacity-100" : "opacity-0"}`}
      >
        {persona.description.map((line, i) => (
          <p
            key={i}
            className="text-[15px] leading-[2]"
            style={{ color: theme.inkSoft, fontFamily: "'Noto Serif SC', serif" }}
          >
            {line}
          </p>
        ))}
      </div>

      {/* 分隔 */}
      <div
        className={`mt-14 mb-10 transition-all duration-1000 delay-[900ms] ${revealPhase >= 3 ? "opacity-100" : "opacity-0"}`}
      >
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px" style={{ background: theme.line }} />
          <span
            className="text-[10px] tracking-[0.4em]"
            style={{ color: theme.inkMuted, fontFamily: "'Cormorant Garamond', serif" }}
          >
            her · literary · sister
          </span>
          <div className="flex-1 h-px" style={{ background: theme.line }} />
        </div>
      </div>

      {/* 对应角色 */}
      <div
        className={`transition-all duration-1000 delay-[1100ms] ${revealPhase >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div
          className="px-6 py-8 relative"
          style={{
            background: theme.paperDark,
            border: `1px solid ${theme.line}`
          }}
        >
          {/* 印章 */}
          <div
            className="absolute -top-4 -right-3 w-14 h-14 flex items-center justify-center rotate-12"
            style={{
              background: theme.accent,
              color: theme.paper,
              fontFamily: "'Noto Serif SC', serif",
              fontSize: "10px",
              letterSpacing: "0.15em",
              lineHeight: 1.3,
              textAlign: "center",
              boxShadow: `0 2px 0 ${theme.ink}08`
            }}
          >
            文学<br />姊妹
          </div>

          <div
            className="text-[10px] tracking-[0.3em] mb-3"
            style={{ color: theme.inkMuted, fontFamily: "'Cormorant Garamond', serif" }}
          >
            YOUR COUNTERPART
          </div>
          <h2
            className="text-[32px] leading-none tracking-tight mb-2"
            style={{
              fontFamily: "'Noto Serif SC', serif",
              color: theme.ink,
              fontWeight: 500
            }}
          >
            {persona.character.name}
          </h2>
          <div
            className="text-[12px] mb-6"
            style={{ color: theme.inkMuted, fontFamily: "'Noto Serif SC', serif" }}
          >
            {persona.character.book}　·　{persona.character.author}　·　{persona.character.year}
          </div>

          <p
            className="text-[14px] leading-[2.1] mb-6"
            style={{ color: theme.inkSoft, fontFamily: "'Noto Serif SC', serif" }}
          >
            {persona.character.intro}
          </p>

          <div
            className="pt-5"
            style={{ borderTop: `1px dashed ${theme.line}` }}
          >
            <div
              className="text-[10px] tracking-[0.3em] mb-2"
              style={{ color: theme.accent, fontFamily: "'Cormorant Garamond', serif" }}
            >
              — LINK —
            </div>
            <p
              className="text-[14px] leading-[1.9] italic"
              style={{ color: theme.ink, fontFamily: "'Noto Serif SC', serif" }}
            >
              {persona.character.link}
            </p>
          </div>
        </div>
      </div>

      {/* 底部操作 */}
      <div
        className={`mt-14 space-y-5 transition-opacity duration-700 delay-[1400ms] ${revealPhase >= 3 ? "opacity-100" : "opacity-0"}`}
      >
        <button
          onClick={onRetake}
          className="w-full py-4 text-[13px] tracking-[0.2em] transition-all active:scale-[0.98]"
          style={{
            border: `1px solid ${theme.ink}`,
            color: theme.ink,
            fontFamily: "'Noto Serif SC', serif",
            background: "transparent"
          }}
        >
          重 新 测 试
        </button>
        <p
          className="text-[11px] text-center tracking-wider"
          style={{ color: theme.inkFaint, fontFamily: "'Noto Serif SC', serif" }}
        >
          切换至「灵魂留言」，看见其他 {persona.name} 的声音
        </p>
      </div>
    </div>
  );
}

// ============ 评论页 ============
function CommentsPanel({ persona }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAll, setLoadingAll] = useState(true);
  const [allByPersona, setAllByPersona] = useState({}); // 所有人格的留言数
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [activePersonaKey, setActivePersonaKey] = useState(persona.key);

  // 加载当前人格的评论 + 所有人格的计数
  useEffect(() => {
    loadComments(activePersonaKey);
  }, [activePersonaKey]);

  useEffect(() => {
    loadAllCounts();
  }, []);

  const loadComments = async (pKey) => {
    setLoading(true);
    try {
      const result = await window.storage.list(`cmt:${pKey}:`, true);
      if (result && result.keys && result.keys.length > 0) {
        const loaded = await Promise.all(
          result.keys.map(async (k) => {
            try {
              const r = await window.storage.get(k, true);
              return r ? JSON.parse(r.value) : null;
            } catch {
              return null;
            }
          })
        );
        const valid = loaded.filter(Boolean).sort((a, b) => b.timestamp - a.timestamp);
        setComments(valid);
      } else {
        setComments([]);
      }
    } catch (e) {
      setComments([]);
    }
    setLoading(false);
  };

  const loadAllCounts = async () => {
    setLoadingAll(true);
    try {
      const counts = {};
      // 列出所有 cmt: 开头的 key
      const result = await window.storage.list("cmt:", true);
      if (result && result.keys) {
        result.keys.forEach((k) => {
          // key 格式: cmt:personaKey:timestamp:rand
          const parts = k.split(":");
          if (parts.length >= 2) {
            const pk = parts[1];
            counts[pk] = (counts[pk] || 0) + 1;
          }
        });
      }
      setAllByPersona(counts);
    } catch (e) {
      setAllByPersona({});
    }
    setLoadingAll(false);
  };

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    if (trimmed.length > 500) {
      alert("留言请控制在 500 字以内");
      return;
    }
    setSubmitting(true);
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    const key = `cmt:${persona.key}:${ts}:${rand}`;
    const comment = {
      id: key,
      personaKey: persona.key,
      personaName: persona.name,
      text: trimmed,
      timestamp: ts
    };
    try {
      const ok = await window.storage.set(key, JSON.stringify(comment), true);
      if (ok) {
        setText("");
        // 立即本地插入，不等再次拉取
        if (activePersonaKey === persona.key) {
          setComments((prev) => [comment, ...prev]);
        }
        setAllByPersona((prev) => ({
          ...prev,
          [persona.key]: (prev[persona.key] || 0) + 1
        }));
      }
    } catch (e) {
      alert("留言失败，请稍后再试");
    }
    setSubmitting(false);
  };

  const formatTime = (ts) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
    const d = new Date(ts);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  // 人格列表（按字数排序）
  const personasList = Object.entries(PERSONAS).map(([k, p]) => ({
    key: k,
    name: p.name,
    count: allByPersona[k] || 0
  }));

  return (
    <div className="px-7 pt-7 pb-16" style={{ background: theme.paper }}>
      {/* 提示 */}
      <div className="mb-7">
        <p
          className="text-[13px] leading-[1.9]"
          style={{ color: theme.inkSoft, fontFamily: "'Noto Serif SC', serif" }}
        >
          你将以「
          <span style={{ color: theme.accent, fontWeight: 500 }}>{persona.name}</span>
          」之名留言。不用具名，但你的话会被后来的
          <span style={{ color: theme.accent, fontWeight: 500 }}>{persona.name}</span>
          看见。
        </p>
      </div>

      {/* 写留言 */}
      <div
        className="mb-8 p-5"
        style={{
          background: theme.paperDark,
          border: `1px solid ${theme.line}`
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`你想对同类的 ${persona.name} 说些什么？`}
          rows={4}
          maxLength={500}
          className="w-full resize-none outline-none bg-transparent text-[14px] leading-[1.9] placeholder:opacity-50"
          style={{
            color: theme.ink,
            fontFamily: "'Noto Serif SC', serif"
          }}
        />
        <div className="flex items-center justify-between mt-3">
          <span
            className="text-[11px]"
            style={{ color: theme.inkFaint, fontFamily: "'Cormorant Garamond', serif" }}
          >
            {text.length} / 500
          </span>
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
            className="px-5 py-2 text-[12px] tracking-[0.2em] transition-all disabled:opacity-30 active:scale-[0.97]"
            style={{
              background: theme.ink,
              color: theme.paper,
              fontFamily: "'Noto Serif SC', serif"
            }}
          >
            {submitting ? "留 下 中" : "留 下 一 句"}
          </button>
        </div>
      </div>

      {/* 切换：只看同类 / 看所有 */}
      <div className="mb-6 flex items-center gap-5 text-[12px] tracking-wider" style={{ fontFamily: "'Noto Serif SC', serif" }}>
        <button
          onClick={() => {
            setShowAll(false);
            setActivePersonaKey(persona.key);
          }}
          className="transition-opacity"
          style={{
            color: !showAll ? theme.ink : theme.inkFaint,
            fontWeight: !showAll ? 500 : 400,
            borderBottom: !showAll ? `1px solid ${theme.accent}` : "1px solid transparent",
            paddingBottom: 3
          }}
        >
          同 类 的 {persona.name}
        </button>
        <button
          onClick={() => setShowAll(true)}
          className="transition-opacity"
          style={{
            color: showAll ? theme.ink : theme.inkFaint,
            fontWeight: showAll ? 500 : 400,
            borderBottom: showAll ? `1px solid ${theme.accent}` : "1px solid transparent",
            paddingBottom: 3
          }}
        >
          所 有 灵 魂
        </button>
      </div>

      {showAll ? (
        <AllPersonasView
          personasList={personasList}
          activeKey={activePersonaKey}
          onSelect={(k) => {
            setActivePersonaKey(k);
            setShowAll(false);
          }}
          loading={loadingAll}
        />
      ) : (
        <CommentsList
          comments={comments}
          loading={loading}
          formatTime={formatTime}
          currentPersonaName={PERSONAS[activePersonaKey].name}
          isMine={(c) => c.personaKey === persona.key}
        />
      )}
    </div>
  );
}

function AllPersonasView({ personasList, activeKey, onSelect, loading }) {
  if (loading) {
    return (
      <div className="py-12 text-center">
        <p className="text-[12px]" style={{ color: theme.inkFaint, fontFamily: "'Noto Serif SC', serif" }}>
          正在收集灵魂的声音……
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p
        className="text-[11px] mb-4 italic"
        style={{ color: theme.inkMuted, fontFamily: "'Noto Serif SC', serif" }}
      >
        点击人格名查看她们的留言
      </p>
      {personasList.map((p) => (
        <button
          key={p.key}
          onClick={() => onSelect(p.key)}
          className="w-full text-left px-4 py-3 flex items-center justify-between transition-all active:scale-[0.99]"
          style={{
            background: p.key === activeKey ? theme.ink : "transparent",
            color: p.key === activeKey ? theme.paper : theme.ink,
            border: `1px solid ${p.key === activeKey ? theme.ink : theme.line}`,
            fontFamily: "'Noto Serif SC', serif"
          }}
        >
          <span className="text-[14px] tracking-[0.1em]">{p.name}</span>
          <span
            className="text-[11px]"
            style={{
              color: p.key === activeKey ? theme.paper : theme.inkMuted,
              fontFamily: "'Cormorant Garamond', serif",
              opacity: 0.7
            }}
          >
            {p.count} 句
          </span>
        </button>
      ))}
    </div>
  );
}

function CommentsList({ comments, loading, formatTime, currentPersonaName, isMine }) {
  if (loading) {
    return (
      <div className="py-12 text-center">
        <p className="text-[12px]" style={{ color: theme.inkFaint, fontFamily: "'Noto Serif SC', serif" }}>
          正在翻阅她们的声音……
        </p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="py-16 text-center space-y-3">
        <Ornament className="w-20 mx-auto" style={{ color: theme.line }} />
        <p className="text-[13px]" style={{ color: theme.inkMuted, fontFamily: "'Noto Serif SC', serif" }}>
          还没有 {currentPersonaName} 留下声音
        </p>
        <p
          className="text-[11px] italic"
          style={{ color: theme.inkFaint, fontFamily: "'Noto Serif SC', serif" }}
        >
          你可以是第一个。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {comments.map((c) => (
        <div
          key={c.id}
          className="relative pl-4"
          style={{ borderLeft: `2px solid ${isMine(c) ? theme.accent : theme.line}` }}
        >
          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-baseline gap-2">
              <span
                className="text-[13px] tracking-[0.1em]"
                style={{
                  color: theme.ink,
                  fontFamily: "'Noto Serif SC', serif",
                  fontWeight: 500
                }}
              >
                {c.personaName}
              </span>
              {isMine(c) && (
                <span
                  className="text-[9px] tracking-[0.2em]"
                  style={{
                    color: theme.accent,
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: "italic"
                  }}
                >
                  · kindred
                </span>
              )}
            </div>
            <span
              className="text-[10px]"
              style={{
                color: theme.inkFaint,
                fontFamily: "'Cormorant Garamond', serif"
              }}
            >
              {formatTime(c.timestamp)}
            </span>
          </div>
          <p
            className="text-[14px] leading-[1.9] whitespace-pre-wrap"
            style={{ color: theme.inkSoft, fontFamily: "'Noto Serif SC', serif" }}
          >
            {c.text}
          </p>
        </div>
      ))}
    </div>
  );
}

// ============ 根组件 ============
export default function App() {
  const [screen, setScreen] = useState("home"); // home | quiz | calc | result
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(null));
  const [result, setResult] = useState(null);

  // 注入字体
  useEffect(() => {
    if (!document.getElementById("xxti-fonts")) {
      const link = document.createElement("link");
      link.id = "xxti-fonts";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  const handleStart = () => {
    setAnswers(Array(QUESTIONS.length).fill(null));
    setQIdx(0);
    setScreen("quiz");
  };

  const handleAnswer = (optIdx) => {
    const next = [...answers];
    next[qIdx] = optIdx;
    setAnswers(next);
    if (qIdx < QUESTIONS.length - 1) {
      setQIdx(qIdx + 1);
    } else {
      // 计算结果
      setScreen("calc");
      setTimeout(() => {
        const r = calculateResult(next);
        setResult(r);
        setScreen("result");
      }, 2700);
    }
  };

  const handleBack = () => {
    if (qIdx > 0) setQIdx(qIdx - 1);
    else setScreen("home");
  };

  const handleRetake = () => {
    setScreen("home");
    setQIdx(0);
    setAnswers(Array(QUESTIONS.length).fill(null));
    setResult(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, #F7F1E6 0%, ${theme.paper} 40%, #EFE7D6 100%)`,
        fontFamily: "'Noto Serif SC', serif"
      }}
    >
      <div className="relative" style={{ zIndex: 1, maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: theme.paper, boxShadow: "0 0 60px rgba(26, 22, 18, 0.04)" }}>
        {screen === "home" && <HomePage onStart={handleStart} />}
        {screen === "quiz" && (
          <QuestionPage qIdx={qIdx} answers={answers} onAnswer={handleAnswer} onBack={handleBack} />
        )}
        {screen === "calc" && <CalculatingPage />}
        {screen === "result" && result && <ResultPage result={result} onRetake={handleRetake} />}
      </div>
    </div>
  );
}

