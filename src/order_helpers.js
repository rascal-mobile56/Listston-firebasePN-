var APP = {};
var WRITER_PRICING;

export function fixed(num, ratio){
    return Number( Number(num).toFixed(ratio||2) );
}

export function init(app){
    Object.assign(APP, app);

    APP.request({
        url:'/api/v1/writer_settings/',
        success(data){
            if(data.writer_pricing){
                WRITER_PRICING = data.writer_pricing;
                WRITER_PRICING['ANK'] = WRITER_PRICING['AN']
            }
        }
    });
}

export function order_status(order){
    if(!order || !order.tags)return '';
    if( order.tags.indexOf('writer_completed')>=0 )return 'completed';
    if( order.tags.indexOf('writer_accept')>=0 )return 'in progress';
    if( order.tags.indexOf('reserve_order')>=0 )return 'reserved';
    return '';
}

export var orders_sort_keys = {
    'deadline':(a,b) => writer_deadline(b) - writer_deadline(a),
    'pages':(a,b) => b.pages - a.pages,
    'price':(a,b) => writer_price(b) - writer_price(a),
}


export function order_size(order){
    if(!order || order.pages === undefined)return '';
    var profile = order.profile || {};
    var pages = order.pages || 1;
    var measured = pages == 1? 'page' :'pages';
    measured = profile.capacity || measured;
     if( measured == 'words'){
            pages = profile.words || profile.size_units || 0;
            return [pages, measured].join(' ');
     }
    if( measured == 'minutes'){
        pages = profile.size_units || 0;
        return [pages, measured].join(' ');
    }
    if( measured == 'slides'){
        return [pages, measured].join(' ');
    }
    return [pages, measured].join(' ');
}

function prefix(order){
    return order.number.match(/^(L|AN|DN|A|\w)/)[0];
}

export function writer_price(order){
    if(!WRITER_PRICING || !order || !order.number)return 0;
    var writer_price = order.writer_price;
    if(writer_price)return writer_price;
    var pre = prefix(order);
    if( /^(AN)/.test(pre))writer_price = writer_price_AN_(order);
    else if( /^(DN)/.test(pre))writer_price = writer_price_DN_(order, pre);
    else if(/^(L)/.test(pre))writer_price = writer_price_L_(order, pre[0]);
    else if(/^(D)/.test(pre))writer_price = writer_price_D_(order, pre[0]);
    else writer_price = writer_price_A_(order, pre[0]);

    return fixed(writer_price || 0);
}


export function writer_deadline(order){
    if(!order || !order.deadline)return '';
    if(order.writer_deadline)return new Date(order.writer_deadline);
    var dlts = new Date(order.deadline).getTime();
    var nowts = Date.now();
    var wts = dlts - nowts;
    if(wts <= 0)return 0;
    if(false && wts < 24*60*60*1000){
        wts -= 60*60*1000;
        if(wts <= 0)return order.deadline;
    }
    else{
        wts = nowts + wts*0.80;
    }
    return new Date(wts);
}


function time_left(order, deadline, now){
    deadline = deadline || new Date(order.deadline);
    now = now || new Date();
    var nowts = now.getTime(), deadlinets = deadline.getTime();

    var hours = parseInt((deadlinets - nowts)/(3600*1000));

    return hours;
}


function _find_dd_ind(dd, table){
    for(var i=table.length;i--;){
        if( dd >= table[i])return i
    }
    return null
}


function writer_price_AN_(order){
    var now = Date.now();
    var start = new Date(order.client_paid || order.created_at).getTime();
    var deadline = new Date(order.deadline).getTime();
    var left_client = parseInt((deadline - start)/(60*60*1000));
    var left_writer = parseInt((deadline - now)/(60*60*1000));
    // console.log(order.number, left_client, left_writer)
    var table = WRITER_PRICING['ANP1'];
    if( left_client >= WRITER_PRICING['ANP1']['_DD'][0]){
        var p1_ddi = _find_dd_ind(left_client, WRITER_PRICING['ANP1']['_DD']);
        var from_p1 = WRITER_PRICING['ANP1']['_DD'][p1_ddi];
        var half_p1 = parseInt(from_p1 + (left_client - from_p1) / 2);
        // console.log(p1_ddi, from_p1, half_p1)
        if( left_writer > half_p1)
            table = WRITER_PRICING['ANP1'];
        else
            table = WRITER_PRICING['ANP2'];
    }
    return _calc_AN_price(order, table)
}

function writer_price_DN_(order, prefix){
    var table = WRITER_PRICING[prefix];
    return _calc_AN_price(order, table);
}

function _calc_AN_price(order, table){
    var DDs = table['_DD'];

    var dd = _find_dd_ind(time_left(order), DDs)
    if( dd === null)
        return null

    var service = order['service_type']
    if(table[service] === undefined )
        return null

    var price = table[service][dd];
    var size = order.pages || 1;

    if( order.profile.capacity == 'words'){
            size = Math.ceil(order.profile.size_units / 100);
            price = price / 3;
    }

    return price * size;

}




function writer_price_L_(order){
    var WRITER_PRICES_ASL = WRITER_PRICING['L'];
    var DLS = WRITER_PRICES_ASL['Deadlines'];
    var otype = order['type'].split(',')[0].replace(/^\s+|\s+$/,'');
    var olevel = order['level'];
    var Price = 0;
    var prices = WRITER_PRICES_ASL['Prices'][otype][olevel];
    DLS = WRITER_PRICES_ASL['Prices'][otype]["Deadlines"] || WRITER_PRICES_ASL['Deadlines'] ;
    if( prices){
        var left = time_left(order)
        for(var i=0;i<DLS.length;i++ ){
            if( left  < DLS[i])
                break
        }
        // i--;
        if (i == 0)
            return null;
        if( left > DLS[DLS.length-1])
            i += 1
        Price = prices[i-1]
    }
    Price = Price * (order.pages || 1) * (order['spacing']=='single'?2:1)

    // if otype == 'presentation' and self.ex_pages:
    //     Price += WRITER_PRICES_ASL['Prices']['academic'][olevel][i-1]*self.ex_pages

    // if otype == 'online':
    //     pass

    // if otype == 'editing' and self._model['ex_pages']:
    //     ex_pages = int(self._model['ex_pages']) or 1
    //     Price += int(WRITER_PRICES_ASL['Prices']['ex_pages'][i-1]*ex_pages)

    // if self.tag_check('progressive_delivery'):
    //     # Price += int(WRITER_PRICES_ASL['Prices']['progressive_delivery'][i-1]*Price/100)
    //     Price += int(WRITER_PRICES_ASL['Prices']['progressive_delivery']*Price/100)

    // if self.tag_check('adv_summary'):
    //     Price += int(WRITER_PRICES_ASL['Prices']['adv_summary'][i-1])
    return Price
}


function writer_price_D_(order){
    return 0;
}

function writer_price_A_(order, prefix){
    var WRITER_PRICES = WRITER_PRICING[prefix];
    var DLS = WRITER_PRICES['Deadlines']
    var prices = WRITER_PRICES['Prices'][order.level]
    if( ! prices)
        return 0;
    var left = time_left(order)
    for(var i=0;i<DLS.length;i++ ){
        if( left  < DLS[i])
            break
    }
    i--;
    if( i == 0)
        return 0;
    if( left > DLS[DLS.length-1])
        i += 1;
    return prices[i-1] * (order.pages || 1) * (order['spacing']=='single'?2:1);

}