import {createApp} from "vue"
import FloatingWindow from "@/components/FloatingWindow.vue";
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';
import {createPinia} from "pinia";

export default defineContentScript({
    matches: [
        // 2024-07-29
        'https://uk.qhstudio.fun/*',
        'https://ubits.club/*',
        'https://discfan.net/*',
        'https://1ptba.com/*',
        'https://pt.gtk.pw/*',
        'https://pt.gtkpw.xyz/*',
        'https://hdsky.me/*',
        'https://u2.dmhy.org/*',
        'https://www.haidan.video/*',
        'https://ssdforum.org/*',
        'https://www.tjupt.org/*',
        'https://tjupt.org/*',
        'https://oldtoons.world/*',
        'https://www.dragonhd.xyz/*',
        'https://pt.eastgame.org/*',
        'https://www.okpt.net/*',
        'https://cnlang.org/*',
        'https://piggo.me/*',
        'https://pt.inswan.fun/*',
        'https://pterclub.com/*',
        'https://ptvicomo.net/*',
        'https://hdhome.org/*',
        'https://pt.hd4fans.org/*',
        'https://pandapt.net/*',
        'https://srvfi.top/*',
        'https://www.joyhd.net/*',
        'https://leaves.red/*',
        'https://www.pttime.org/*',
        'https://www.pttime.top/*',
        'https://dicmusic.com/*',
        'https://pt.hdupt.com/*',
        'https://sharkpt.net/*',
        'https://carpt.net/*',
        'https://kamept.com/*',
        'https://iptorrents.com/*',
        'https://share.ilolicon.com/*',
        'https://www.oshen.win/*',
        'https://hdvbits.com/*',
        'https://zmpt.cc/*',
        'https://dogpt.cc/*',
        'https://hdtime.org/*',
        'https://hdpt.xyz/*',
        'https://pt.0ff.cc/*',
        'https://pt.2xfree.org/*',
        'https://et8.org/*',
        'https://www.nicept.net/*',
        'https://nicept.net/*',
        'https://www.3wmg.com/*',
        'https://cinemaz.to/*',
        'https://hd-space.org/*',
        'https://ourbits.club/*',
        'https://pthome.net/*',
        'https://www.pthome.net/*',
        'https://www.qingwapt.com/*',
        'https://qingwapt.com/*',
        'https://new.qingwa.pro/*',
        'https://pt.keepfrds.com/*',
        'https://pt.itzmx.com/*',
        'https://www.hdkyl.in/*',
        'https://cyanbug.net/*',
        'https://hd-torrents.org/*',
        'https://filelist.io/*',
        'https://pt.soulvoice.club/*',
        'https://www.icc2022.com/*',
        'https://www.icc2022.top/*',
        'https://icc2022.com/*',
        'https://icc2022.top/*',
        'https://exoticaz.to/*',
        'https://52pt.site/*',
        'https://dajiao.cyou/*',
        'https://hdfun.me/*',
        'https://star-space.net/*',
        'https://kufei.org/*',
        'https://www.open.cd/*',
        'https://open.cd/*',
        'https://www.yemapt.org/*',
        'https://www.hitpt.com/*',
        'https://wintersakura.net/*',
        'https://t.tosky.club/*',
        'https://ptchdbits.co/*',
        'https://springsunday.net/*',
        'https://*.m-team.cc/*',
        'https://*.m-team.io/*',
        'https://nanyangpt.com/*',
        'https://club.hares.top/*',
        'https://ptfans.cc/*',
        'https://hdmayi.com/*',
        'http://hdmayi.com/*',
        'https://ptchina.org/*',
        'https://monikadesign.uk/*',
        'https://www.beitai.pt/*',
        'https://greatposterwall.com/*',
        'https://xingtan.one/*',
        'https://zeus.hamsters.space/*',
        'https://hudbt.hust.edu.cn/*',
        'https://azusa.wiki/*',
        'https://www.torrentleech.cc/*',
        'https://www.torrentleech.org/*',
        'https://www.torrentleech.me/*',
        'https://ptcafe.club/*',
        'https://ptsbao.club/*',
        'https://hdchina.org/*',
        'https://wukongwendao.top/*',
        'https://pt.btschool.club/*',
        'https://ultrahd.net/*',
        'https://hdcity.city/*',
        'https://hdcity.leniter.org/*',
        'https://hdcity.work/*',
        'https://www.gamegamept.com/*',
        'https://pt.hdpost.top/*',
        'https://rousi.zip/*',
        'https://www.hddolby.com/*',
        'https://hdfans.org/*',
        'https://hdvideo.one/*',
        'https://pt.sjtu.edu.cn/*',
        'https://crabpt.vip/*',
        'https://hhanclub.top/*',
        'https://hhan.club/*',
        'https://gamerapt.link/*',
        'https://hdatmos.club/*',
        'https://totheglory.im/*',
        'https://www.agsvpt.com/*',
        'http://cf-old.agsvpt.com/*',
        'https://jpopsuki.eu/*',
        'http://public.ecustpt.eu.org/*',
        'https://pt.ecust.pp.ua/*',
        'https://public.ecustpt.eu.org/*',
        'https://pt.cdfile.org/*',
        'https://www.htpt.cc/*',
        'https://audiences.me/*',
        'https://reelflix.xyz/*',
        'https://www.ptlsp.com/*',
        'https://zhuque.in/*',
        'https://hdarea.club/*',
        'http://pt.tu88.men/*',
        'https://avistaz.to/*',
        'https://pt.zhuoyue.de/*',
        'https://raingfh.top/*',
        'https://ptzone.xyz/*',
        'https://ptlgs.org/*',
        'https://pt.ghacg.com/*',
        'https://hdbao.cc/*',
        'https://www.invites.fun/*',
        'https://www.52movie.top/*',
        'https://lemonhd.club/*',
        'https://pt.hdclone.org/*',
        'https://www.tleechreload.org/*',
        'https://njtupt.top/*',
        'https://aither.cc/*',
        'https://blutopia.cc/*',
        'https://fearnopeer.com/*',
        'https://sunnypt.top/*',
        'https://pt.ldoapp.tech/*',
        'https://www.ptzone.xyz/*',
        'https://pt.pagesecond.cn/*',
        'https://lst.gg/*',
        // 2025-01-20
        'https://www.ptlover.cc/*',
        // 2025-02-02
        'https://hspt.club/*',
        'https://tracker.ldo.pics/*',
        // 2025-02-22
        "https://pg.52ssr.love/*",
        // 2025-02-25
        'https://cspt.top/*',
        'https://xingyunge.top/*',
        'https://tmpt.top/*',
        // 2025-02-26
        "https://sanpro.pw/*",
        // 2025-03-02
        "https://torrenthub.club/*",
        // 2025-03-15
        "https://mckk88.top/*",
        // 2025-03-25
        "https://yinghuapt.top/*",
        "https://sewerpt.com/*",
        // 2025-03-25
        "https://lemonhd.net/*",
        // 2025-03-29
        "https://bilibili.download/*",
        // 2025-04-02
        "https://pt.upxin.net/*",
        // 2025-04-12
        "https://byr.pt/*",
        // 2025-04-24
        "https://playletpt.xyz/*",
        // 2025-05-10
        "https://cspt.cc/*",
        "https://cspt.date/*",
        // 2025-05-22
        'https://hdsky.my/*',
        // 2025-05-24
        'https://www.ptskit.com/*',
        // 2025-06-10
        'https://pt.xingyungept.org/*',
        // 2025-06-11
        'https://pt.ourhelp.club/*',
        // 2025-06-10
        'https://pt.xingyungept.org/*',
        // 2025-06-11
        'https://pt.ourhelp.club/*',
        'https://chdbits.co/*',
        'https://gd.chddiy.xyz/*',
    ],
    // 2. Set cssInjectionMode
    cssInjectionMode: 'ui',

    async main(ctx) {
        // 3. Define your UI
        const ui = await createShadowRootUi(ctx, {
            name: 'harvest-ui',
            position: "inline",
            anchor: 'body',
            onMount(container) {

                const app = createApp(FloatingWindow);
                app.use(Antd)
                app.use(createPinia())
                app.mount(container);
                return app;
            },
            onRemove: (app) => {
                if (app) {
                    app.unmount();
                }
            },
        });

        // 4. Mount the UI
        ui.mount();
    },
});


