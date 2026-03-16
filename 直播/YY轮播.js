// @name YY轮播
// @author 
// @description 
// @dependencies: axios
// @version 1.0.0
// @downloadURL https://gh-proxy.org/https://github.com/Silent1566/OmniBox-Spider/raw/refs/heads/main/直播/YY轮播.js
const axios = require("axios");
const OmniBox = require("omnibox_sdk");

// ========== 全局配置 ==========
const MOBILE_UA = "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.181 Mobile Safari/537.36";
const DEFAULT_PIC = "https://img.alicdn.com/imgextra/i2/O1CN01m9V4QW1j9y9z9z9z9_!!6000000004502-2-tps-200-200.png";

// 默认画质 (PHP源码默认是4500)
const DEFAULT_QUALITY = "4500"; 

// ========== 频道数据源 (ID列表) ==========
const RAW_DATA = `
电影,#genre#
【林正英经典】玄幻电影,1462895099
超精彩武打场景,1354936131
林正英-经典电影,34229877
周星驰搞笑在线,1351537467
港片喜剧动作,1355480591
经典鬼片3000部,29460894
林正英经典,1351505899
李连杰功夫经典武侠,74613175
张国荣与周润发的兄弟情,1354930961
夏洛特烦恼-国内电影-喜剧,1354936201
鹿鼎记-周星驰版,1354658049
赌神港片喜剧,1355112116
智取威虎山,1382736843
成龙系列,1354888751
超清鬼片港片,1335509613
洪金宝福星系列,1354924839
震撼！国内功夫大片,1382736902
国内玄幻电影-林正英,1354932444
速度与激情全集,1382749892
漫威十年老粉福利来了,1354930233
宋小宝春晚小品合集,1382736866
巩汉林春晚小品合集,1354889035
科幻惊悚片-异形,1382735543
小鬼当家-童年回忆,1382745104
电影黑豹,1382736816
电影百团大战,1382736871
周星星系列,1354888671
猩球崛起-怪兽片合集,1354930181
爆笑电影！王牌大贱谍2-3,1382735556
爆笑电影！王牌大贱谍2-3,1354936169
蔡明春晚小品,1354936177
飓风营救,1382735547
国外黑色喜剧：冷幽默小剧场,1382745175
国产大片电影,1354926655
郭德纲-坑王驾到,1382745111
末日系列-外国电影合集,1354889019
憨豆先生-经典喜剧,1354936239
国产电影-就是闹着玩的,1354931503
心理追凶-烧脑港剧,1354936207
忠烈杨家将,1382749909
精武英雄-李连杰主演经典动作片,1382736873
赌神-发哥,1354889044
黑衣人1、2—动作喜剧大片,1354930936
毒液：致命守护者,1382745095
加勒比海盗系列,1382749914
银河护卫队-国外科幻巨作,1382736815
国外高分大片,1382736867
蝙蝠侠：侠影之谜,1382736719
太空荒野求生记-火星救援,1354930957
嫌疑人X的献身-悬疑,1382749953
科幻电影-环太平洋,1354936170
降魔传-神魔大战,1354932371
白鹿原-国内经典战争片,1354931488
史密斯夫妇-婚姻生活的童话演绎,1382736719
经典武侠电影-如来神掌,1382749944
海王-院线大片,1354936142
马丽主演戏剧片-东北虎,1354936199
章子怡主演-浮生如梦,1382735566
超燃科幻大片：明日边缘,1382736835
欧美配音电影！！！,1354693629
霹雳火：速度与激情,1382736895
多力特的奇幻冒险-和动物对话,1354930927
王牌特工：特工学院,1354936195
前任攻略：爱情喜剧,1354932409
无限复活-张柏芝主演爱情电影,1382745190
蚁人-微观世界大 adventure,1382736913
洪金宝经典喜剧电影,1354889042
史诗级科幻电影-阿凡达,1382735577
热血抗日电影,1382749907
科幻佳片-银翼杀手2049,1354936136
诺兰影片-敦刻尔克大撤退,1382749910
沉睡魔咒-不一样的童话视觉,1382736849
不日成婚：婚恋喜剧,1354936214
鲛珠传-奇幻之旅,1354936231
红河谷-爱恨交响曲,1354936181
九层妖塔,1354936116
贫民窟的百万富翁,1382735561
爱情片合集-童梦奇缘,1354926622
一条狗的使命1,1382745092
缉魂-科幻悬疑电影,1382745090
调音师-旋律奇遇,1382749911
分手木马计,1354936228
郑恺主演运动喜剧-超越,1382736863
喜剧电影：冒牌天神1-2,1354936210
英伦犯罪喜剧-两杆大烟枪,1354658051
孙红雷古天乐主演犯罪动作片,1382735552
喜剧爱情电影：不期而遇,1382745181
古人踢足球，爆笑仙球大战,1354930945
经典科幻电影-2001漫游太空,1354926671
明日战记-科幻战争片,1354936221
果酱熊的萌愈之力-帕丁顿熊2,1382735627
张涵予主演犯罪动作大片,1382736865
伯爵的复仇之旅,1382735581
九龙不败-警匪动作片,1354933556
当爸爸变成我兄弟？,1382749887
重返青春-回到过去拥抱你,1382749940
疯狂一家秀,1382736715
不一样的花木兰传奇,1354930903
连续剧,#genre#
武林外传,1355652820
【水浒传】24h,1382702247
靓剑,1356043643
湸剑,23206872
纪晓岚,1354143978
每天都等你,1353215589
【狂飙2老默】首播,1354790484
弹幕天团下饭神剧,23512910
少年包青天,1356043677
纪晓岚,1352227227
神探狄仁杰1,1382851575
丸子,1382851588
地下交通站,1382736795
真实案件系列,1382671124
朵宝陪你看狄仁杰,1353753252
正阳门下,1354931580
小惠_郭德纲相声迷,1382851593
【新三国】萌儿陪看,29216766
内在美-伊人有约,1382737892
【靓剑】乐乐陪看,1352946111
赵本山《蓝光版》,32160832
神雕侠侣,1351762426
济公,1355265814
赵本山《超清版》,1382683959
8090年的热血与回忆,1356243352
超喜剧地下交通站男神贾贵,1353428972
隋唐英雄传,1352475619
古惑仔,1458015189
雯子：港剧,1456829119
雍正王朝,1356043620
燕双鹰,1352227153
【鹿鼎记】金庸经典,28265277
经典抗战剧,1354555195
《武林外传》武侠,1394000563
水浒传,1353873252
《仙侠》开局无敌了,29600150
康熙微服私访记,1352811698
狄仁杰,1351755386
勇敢的心~24经典好剧,1354744544
神医喜来乐,1382714119
热度榜1.包青天,22701868
83射雕英雄传,1354210357
薛仁贵传奇,1355260662
大家车言论,1382570702
好先生,79382500
鹿鼎记-高清全集,1382704650
宰相刘罗锅,1382745191
逋鞠盗-国产喜剧,1382736856
情满四合院-高分电视剧,1382735541
寻秦记-穿越剧经典,1382749900
西游记后传,1382736846
风筝,1382828770
鹿鼎记-周星驰版,1354658049
每天都要快乐哦！,1354930909
少年包青天第三部,1382736814
风筝,1382828770
智取威虎山,1382736843
少年包青天,1414846486
二号交通站,1382735582
小美美正在直播,1354143966
【鸡毛飞上天】,1354806550
林正英全集,1353685311
天龙神雕经典回忆,68260522
天龙八部,1351814644
24h七星鲁王宫,1355171357
小太阳正在直播,29067083
【经典港片】佟瑶,23531261
迷糊不迷糊正在直播,1461931969
燕双鹰,1354143942
倚天屠龙记,33300793
进来陪你看电视,1353518742
天龙神雕金庸,1356043609
甜心正在直播,1454732419
【武林客栈】,1382773728
新白娘子传奇,1354490667
【新三国】,1382851415
老妖私影院,1354952229
奇缘港台影院,1354889234
笑傲江湖4K超清,1354282410
经典电影重温,1382793140
豪哥带我们发财,23402146
无敌燕双鹰,1354825244
铁齿铜牙纪晓岚,1382781415
小爽东北菇凉，求守护,1382609850
YY用户,1382736808
啊咧,1459243913
神探狄仁杰2,1382828767
YY用户,1382736818
恋歌,1382746276
神探狄仁杰1,1354930934
情满四合院,1382736848
欢乐集结号-每天笑不停,1382741642
父母爱情,1354926650
新白娘子传奇-女神赵雅芝,1354930969
双月之城-国漫,1382736907
华子系列,1354888726
晨晨的影视小窝,1382851576
《石敢当》六耳猕猴,1394156613
颜值永远在线,1382851582
郝蕾演绎-情满四合院,1382745089
小兵张嘎,1354930225
都挺好-电视剧,1382736892
纯纯纯儿,1382851589
大家都在看的电视剧,1354930964
血色浪漫,1354926676
宝莲灯前传,1354931631
战狼10086,1382773686
暖暖1999,1382851591
金婚,1382736832
欢乐颂,1382851577
二号交通站,1354930965
欢乐颂,1382735624
恋歌,1382851594
鱼美美隋唐英雄传,1355102749
杭小妞,1382851590
24h我爱我家纯音频,1356212303
YY用户,1382745117
神探狄仁杰,38338029
国内高分悬疑剧-风筝,1354931585
情满四合院,1382851524
经典港片动作搞笑,1459869766
宰相刘罗锅,1353892468
活力满满,1382851585
保护我家蓉儿,1370293254
`;

// ========== 数据解析 ==========
let ID_NAME_MAP = {};
let CHANNELS = {};

function initData() {
    const lines = RAW_DATA.trim().split('\n');
    let currentCategory = "默认";
    CHANNELS = {};
    ID_NAME_MAP = {};

    lines.forEach(line => {
        line = line.trim();
        if (!line) return;
        if (line.includes('#genre#')) {
            currentCategory = line.split(',')[0];
            CHANNELS[currentCategory] = [];
        } else {
            const parts = line.split(',');
            if (parts.length >= 2) {
                const name = parts[0];
                const id = parts[1];
                CHANNELS[currentCategory].push({ name, id });
                ID_NAME_MAP[id] = name;
            }
        }
    });
}
initData();

// ========== 工具函数 ==========
const logInfo = (message, data = null) => {
    const output = data ? `${message}: ${JSON.stringify(data)}` : message;
    OmniBox.log("info", `[YY] ${output}`);
};

const logError = (message, error) => {
    OmniBox.log("error", `[YY] ${message}: ${error.message || error}`);
};

function parsePlaySources(sourceName, episodesStr) {
    const playSources = [];
    if (!episodesStr) return playSources;
    
    const episodes = episodesStr.split('#').map(item => {
        const [name, playId] = item.split('$');
        return { name: name || '正片', playId: playId || name };
    });

    if (episodes.length > 0) {
        playSources.push({ name: sourceName, episodes: episodes });
    }
    return playSources;
}

// ========== 接口实现 ==========

async function home(params) {
    let classes = Object.keys(CHANNELS).map(key => ({
        'type_id': key,
        'type_name': key
    }));
    return { class: classes, list: [] };
}

async function category(params) {
    const tid = params.categoryId || params.type_id;
    const items = CHANNELS[tid] || [];
    let list = items.map(item => ({
        "vod_id": item.id,
        "vod_name": item.name,
        "vod_pic": DEFAULT_PIC, 
        "vod_remarks": "Live",
    }));
    return { list, page: 1, pagecount: 1, limit: list.length, total: list.length };
}

async function search(params) {
    return { list: [] };
}

/**
 * 详情页：生成多画质选项
 */
async function detail(params) {
    const id = params.videoId;
    logInfo(`请求详情 ID: ${id}`);
    
    let realName = ID_NAME_MAP[id] || `YY直播:${id}`;
    let realPic = DEFAULT_PIC;

    try {
        const wapUrl = `https://wap.yy.com/mobileweb/${id}`;
        const res = await axios.get(wapUrl, {
            headers: { 'User-Agent': MOBILE_UA },
            timeout: 5000
        });
        const html = res.data;

        // 匹配封面
        const picMatch = html.match(/"snapshot"\s*:\s*"([^"]+)"/) || html.match(/snapshot\\":\\"([^"]+)\\"/);
        if (picMatch && picMatch[1]) {
            realPic = picMatch[1].replace(/\\/g, "");
            if (!realPic.startsWith("http")) realPic = "https:" + realPic;
        }

        // 匹配标题
        const nameMatch = html.match(/"nickname"\s*:\s*"([^"]+)"/) || html.match(/nickname\\":\\"([^"]+)\\"/);
        if (nameMatch && nameMatch[1]) {
            realName = nameMatch[1];
        }

        logInfo("详情抓取成功", { name: realName, pic: realPic });

    } catch (e) {
        logError("详情抓取失败，使用默认信息", e);
    }

    // 关键修改：生成多画质列表
    // 格式: 显示名称$ID_画质代码 (参考PHP注释)
    // 1200(360P)、2500(480P)、4500(720P)、8000(1080P)
    // 默认把 4500 放第一位，因为最稳
    const playUrlStr = `超清(720P)$${id}_4500#蓝光(1080P)$${id}_8000#高清(480P)$${id}_2500#标清(360P)$${id}_1200`;
    
    const playSources = parsePlaySources("YY高清", playUrlStr);

    return {
        list: [{
            "vod_id": id,
            "vod_name": realName,
            "vod_pic": realPic,
            "vod_play_sources": playSources,
            "vod_content": `主播：${realName}\n提示：如蓝光无法播放请切换超清`,
            "vod_remarks": "直播中"
        }]
    };
}

/**
 * 播放解析：动态解析画质参数
 */
async function play(params) {
    let rid = params.playId;
    let quality = DEFAULT_QUALITY; // 默认 4500

    // 解析 ID_Quality 格式
    if (rid.includes("_")) {
        const parts = rid.split("_");
        rid = parts[0];
        quality = parts[1];
    }
    
    const headers = {
        "Referer": "https://wap.yy.com/",
        "User-Agent": MOBILE_UA
    };

    const url = `https://interface.yy.com/hls/new/get/${rid}/${rid}/${quality}?source=wapyy&callback=jsonp3`;

    logInfo(`解析播放: ${rid}, 画质: ${quality}, URL: ${url}`);

    try {
        const res = await axios.get(url, { 
            headers: headers,
            timeout: 8000
        });

        const content = res.data.toString();
        const match = content.match(/jsonp3\(([\s\S]*?)\)/);

        if (match && match[1]) {
            const json = JSON.parse(match[1]);
            
            if (json && json.hls) {
                const hlsUrl = json.hls;
                logInfo("解析成功", { url: hlsUrl });
                
                return {
                    parse: 0,
                    url: hlsUrl,
                    header: headers
                };
            }
        }
    } catch (e) {
        logError("播放解析请求失败", e);
    }

    return { error: "未获取到播放地址" };
}

module.exports = { home, category, search, detail, play };

if (typeof require !== 'undefined' && require.main === module) {
    const runner = require("spider_runner");
    runner.run(module.exports);
}
