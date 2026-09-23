// Manufacturer photo library (dealer-authorized images stored under
// /assets/images/brands/). Shared by the public product grid (products.js)
// and the admin Products editor, which can auto-match a product name to a
// photo or let you pick one from a dropdown.
//
// A product's `photo` may be either a Supabase storage path (uploaded in
// admin) or a site path starting with "/" (from this library).
(function () {
    var B = '/assets/images/brands/';

    // name: shown in the admin dropdown. match: lower-case fragments; a
    // product whose name contains ALL fragments of an entry matches it.
    var LIBRARY = {
        fisher: [
            { name: 'HS plow', path: B + 'fisher/hs-truck.webp', match: [['hs']] },
            { name: 'HT Series', path: B + 'fisher/ht-series.webp', match: [['ht']] },
            { name: 'SD Series', path: B + 'fisher/sd-series.webp', match: [['sd']] },
            { name: 'HD2', path: B + 'fisher/hd2.webp', match: [['hd2']] },
            { name: 'HDX', path: B + 'fisher/hdx.webp', match: [['hdx']] },
            { name: 'HC', path: B + 'fisher/hc.webp', match: [['hc']] },
            { name: 'EZ-V', path: B + 'fisher/ez-v.webp', match: [['ez-v'], ['ez v'], ['ezv']] },
            { name: 'XtremeV', path: B + 'fisher/xtremev.webp', match: [['xtreme']] },
            { name: 'XV2', path: B + 'fisher/xv2.webp', match: [['xv2']] },
            { name: 'XLS', path: B + 'fisher/xls.webp', match: [['xls']] },
            { name: 'XRS', path: B + 'fisher/xrs.webp', match: [['xrs']] },
            { name: 'Storm Boxx HX', path: B + 'fisher/storm-boxx-hx.webp', match: [['storm', 'hx'], ['boxx', 'hx']] },
            { name: 'Storm Boxx', path: B + 'fisher/storm-boxx.webp', match: [['storm'], ['boxx']] },
            { name: 'Trailblazer UTV plow', path: B + 'fisher/trailblazer-utv.webp', match: [['trailblazer']] },
            { name: 'Tempest (stainless)', path: B + 'fisher/tempest-steel.webp', match: [['tempest']] },
            { name: 'Tempest Poly', path: B + 'fisher/tempest.webp', match: [['tempest', 'poly']] },
            { name: 'Tempest Compact', path: B + 'fisher/tempest-compact.webp', match: [['tempest', 'compact']] },
            { name: 'Poly-Caster UTV', path: B + 'fisher/poly-caster.webp', match: [['poly-caster'], ['poly caster'], ['polycaster']] },
            { name: 'TrailCommander', path: B + 'fisher/trailcommander.webp', match: [['trailcommander'], ['trail commander']] },
            { name: 'Quick-Caster 300W', path: B + 'fisher/quick-caster-300.webp', match: [['quick', '300w']] },
            { name: 'Quick-Caster 300 / 300G', path: B + 'fisher/quick-caster-300g.webp', match: [['quick-caster'], ['quick caster'], ['quickcaster']] },
            { name: 'Low Profile 500 UTV', path: B + 'fisher/low-profile-500.webp', match: [['low profile', 'utv'], ['low-profile', 'utv']] },
            { name: 'Low Profile 500 / 1000 / 2500', path: B + 'fisher/low-profile-2500.webp', match: [['low profile'], ['low-profile']] },
            { name: 'Speed-Caster 525 / 900', path: B + 'fisher/speed-caster-525.webp', match: [['speed-caster'], ['speed caster'], ['speedcaster']] },
            { name: 'Walk-behind spreader', path: B + 'fisher/walk-behind.webp', match: [['walk'], ['wb-'], ['wb1']] },
            { name: 'Sidewalk sprayer', path: B + 'fisher/sidewalk-sprayer.webp', match: [['sprayer']] },
            { name: 'RB-400 rotary broom', path: B + 'fisher/rotary-broom.webp', match: [['broom'], ['rb-400'], ['rb400']] }
        ],
        toro: [
            { name: 'Power Clear (single-stage)', path: B + 'toro/two-stage-38755.webp', match: [['power clear'], ['powerclear'], ['single']] },
            { name: '60V Power Clear e-Power', path: B + 'toro/power-clear-60v.webp', match: [['60v', 'clear'], ['e-power'], ['epower'], ['battery', 'snow']] },
            { name: 'Power Max HD', path: B + 'toro/power-max-hd-38891.webp', match: [['power max', 'hd'], ['powermax', 'hd'], ['max hd']] },
            { name: 'Power Max', path: B + 'toro/powermax-37798.webp', match: [['power max'], ['powermax'], ['two-stage'], ['two stage'], ['2-stage']] },
            { name: 'SnowMaster', path: B + 'toro/two-stage-38843.webp', match: [['snowmaster'], ['snow master']] },
            { name: 'Recycler', path: B + 'toro/recycler-21321.webp', match: [['recycler']] },
            { name: 'Super Recycler', path: B + 'toro/super-recycler-21565.webp', match: [['super recycler'], ['super-recycler']] },
            { name: '60V Recycler (battery)', path: B + 'toro/battery-mower-21466.webp', match: [['60v', 'recycler'], ['battery', 'mower'], ['60v', 'mower']] },
            { name: 'TimeMaster', path: B + 'toro/timemaster-21200.webp', match: [['timemaster'], ['time master']] },
            { name: 'TimeCutter', path: B + 'toro/timecutter-77503.webp', match: [['timecutter'], ['time cutter']] },
            { name: 'eTimeCutter (battery)', path: B + 'toro/etimecutter-75851.webp', match: [['etimecutter'], ['e-timecutter'], ['etime']] },
            { name: 'Titan', path: B + 'toro/titan-76511.webp', match: [['titan']] },
            { name: 'Zero-turn (lifestyle)', path: B + 'toro/billboard-zero-turn.webp', match: [['zero turn'], ['zero-turn'], ['ztr']] },
            { name: 'Walk mower (lifestyle)', path: B + 'toro/billboard-walk-mower.webp', match: [['walk']] },
            { name: 'Snow blower (lifestyle)', path: B + 'toro/billboard-snow.webp', match: [['snow blower'], ['snowblower'], ['snow thrower']] }
        ],
        stihl: [
            { name: 'MS 162 chainsaw', path: B + 'stihl/ms-162.webp', match: [['162']] },
            { name: 'MS 251 Wood Boss', path: B + 'stihl/ms-251-wood-boss.webp', match: [['251'], ['wood boss']] },
            { name: 'Chainsaws', path: B + 'stihl/cat-chainsaws.webp', match: [['chainsaw'], ['chain saw'], ['ms ']] },
            { name: 'Trimmers & brushcutters', path: B + 'stihl/cat-trimmers.webp', match: [['trimmer'], ['brushcutter'], ['fs ']] },
            { name: 'Blowers', path: B + 'stihl/cat-blowers.webp', match: [['blower'], ['br '], ['bg ']] },
            { name: 'Hedge trimmers', path: B + 'stihl/cat-hedge-trimmers.webp', match: [['hedge'], ['hs ']] },
            { name: 'Pole pruners', path: B + 'stihl/cat-pole-pruners.webp', match: [['pole'], ['pruner'], ['ht ']] },
            { name: 'KombiSystem', path: B + 'stihl/cat-multi-task.webp', match: [['kombi'], ['km ']] },
            { name: 'AK / AP batteries', path: B + 'stihl/cat-batteries.webp', match: [['battery'], ['batteries'], ['ak '], ['ap ']] },
            { name: 'Saw chains', path: B + 'stihl/parts-saw-chains.webp', match: [['chain']] },
            { name: 'Guide bars', path: B + 'stihl/parts-guide-bars.webp', match: [['bar']] },
            { name: 'Chainsaw accessories / apparel', path: B + 'stihl/parts-chainsaw-accessories.webp', match: [['chaps'], ['apparel'], ['helmet'], ['accessor']] }
        ]
    };

    function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); }

    // Pick the most specific match (most fragments, then longest fragment text).
    function matchBrandPhoto(brand, productName) {
        var list = LIBRARY[brand] || [];
        var n = norm(productName);
        if (!n) return null;
        var best = null, bestScore = 0;
        list.forEach(function (entry) {
            entry.match.forEach(function (frags) {
                var ok = frags.every(function (f) { return n.indexOf(f) !== -1; });
                if (!ok) return;
                var score = frags.length * 100 + frags.join('').length;
                if (score > bestScore) { bestScore = score; best = entry; }
            });
        });
        return best;
    }

    // Resolve a stored photo value to a URL: site paths pass through,
    // anything else is a storage path in the equipment-photos bucket.
    function resolvePhotoUrl(photo) {
        if (!photo) return '';
        if (/^(https?:)?\//.test(photo)) return photo;
        return (typeof getImageUrl === 'function') ? getImageUrl(photo) : '';
    }

    window.BRAND_PHOTOS = LIBRARY;
    window.matchBrandPhoto = matchBrandPhoto;
    window.resolvePhotoUrl = resolvePhotoUrl;
})();
