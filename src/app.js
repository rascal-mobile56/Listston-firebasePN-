import "babel-polyfill";
import Vue from 'vue'
import VueRouter from 'vue-router'
import moment from 'moment';

import * as helpers from './order_helpers.js'
import eFilters from './filters.vue'
import eSubjects from './subjects.vue'
import eOrders from './orders.vue'
import eSubjectOrders from './subject_orders.vue'
import eRecomendedOrders from './recomended_orders.vue'
import eOrderDetails from './order_details.vue'
import eOrderMessages from './order_messages.vue'
import eLogin from './login.vue'
import eWorkStatus from './workstatus.vue'
import eMore from './more.vue'
import eOnBoard from './onboard.vue'

"use strict"

window.APP = {}

function query(obj){
    var q = "";
    for(var k in obj){
        q +=k + "=" + String(obj[k]) + "&";
    }
    return q.replace(/&$/,'');
}

APP['request'] = function(opt){
    opt = opt || {};
    var x = new XMLHttpRequest();
    var nooverlay = opt.nooverlay;
    if(opt.url && opt.url[0]=='/')opt.url = APP.baseUrl + opt.url
    x.open(opt.method||'get',opt.url,1);
    x.onreadystatechange = function() {
        if (x.readyState == 4) {
            if(!nooverlay)APP.request.loader(-1);
            if( opt.complete )opt.complete(x.responseText, x);
            if(x.status == 401){
                document.dispatchEvent(new Event('unauthorized'));
            }
            if(x.status == 200 && opt.success) {
                try{
                    var success_data = JSON.parse(x.responseText);
                    if(success_data.csrftoken)APP.STATE.csrftoken = success_data.csrftoken;
                    opt.success(success_data, x);
                }catch(e){
                   opt.success(x.responseText, x);
                }
            }else if(opt.fail){
                opt.fail(x);;
            }
        }
    }
    x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    if(/post/i.test(opt.method)){
        x.setRequestHeader('Content-Type','application/x-www-form-urlencoded' );
        if(APP.STATE.csrftoken){
            x.setRequestHeader("X-CSRFToken", APP.STATE.csrftoken);
            if(opt.data && typeof opt.data =='object')opt.data['csrfmiddlewaretoken']=APP.STATE.csrftoken;
        }
    }
    else x.setRequestHeader('Content-Type','text/html' );
    x.setRequestHeader('X-Token', APP.STATE.sessionid || '');
    if(opt.headers)for(var k in opt.headers){ x.setRequestHeader(k, opt.headers[k]); }
    // x.withCredentials = true;
    if(opt.data && typeof opt.data =='object')opt.data = query(opt.data);
    if(!nooverlay)APP.request.loader(1);
    x.send(opt.data||null);
    return x;
}
APP.request.loader_counter = 0;
APP.request.loader = function(step){
    APP.request.loader_counter += step;
    if(APP.request.loader_counter)$('#request_loader_overlay').show();
    else $('#request_loader_overlay').hide();
}
// X-CSRFToken csrftoken csrfmiddlewaretoken


    APP['baseUrl'] = "http://application.livingston-research.com";
    // baseUrl:'http://application.livingston-research.com',
    APP['STATE']={};
    APP['get_state'] = function(k){
        if(!APP.STATE)APP.load_state();
        return APP.STATE[k];
    };
    APP['load_state'] = function(){
        APP.STATE = JSON.parse(localStorage['APPSTATE']||"{}");
    };
    APP['save_state'] = function(k, v){
        if(k)APP.STATE[k]=v;
        if(!APP.STATE)APP.load_state();
        localStorage['APPSTATE'] = JSON.stringify(APP.STATE);
    };

function APP_START(){

    window.FirebasePlugin.grantPermission();
    window.FirebasePlugin.hasPermission(function(data){
        alert(data.isEnabled);
    });

    APP.load_state();

    APP.auth = function(email, passwd, success, fail){
        APP.request({
            url:"/accounts/login/?_ajax=1",
            method:'post',
            data:encodeURI("email="+email+"&password="+passwd),
            success:function(data, x){
                if(data.session){
                    APP.save_state("sessionid", data.session);
                    if(success)success(data);
                }
                else{
                    APP.save_state("sessionid", "");
                    if(fail)fail(data.result);
                }
            },
            fail:function(x){fail(x.responseText||x.statusText);}
        })
    }


    document.addEventListener('unauthorized', function(){
        APP.save_state('sessionid',null);
        // window.location = "index.html";
        window.location.reload();
    }, false);


    Vue.use(VueRouter);

    var router = new VueRouter({ routes:[] });

    router.up = function(){
        var path = this.currentRoute.path.split('/');
        if(path.length > 1 ){
            path.pop();
            this.replace(path.join('/'));
        }else if(path.length == 1 ){
            this.replace('/');
        }
    }

    Vue.filter('datetime',function(d){
                return moment.utc(d).local().format('MMM D, LT');
            }
        );//Vue.filter('datetime'

    Vue.filter('date',function(d){
                return moment.utc(d).local().format('MMM D');
            }
        );//Vue.filter('datetime'

    Vue.filter('time',function(d){
                return moment.utc(d).local().format('LT');
            }
        );//Vue.filter('datetime'

    Vue.filter('price',function(d){
                return Number(d) ? Number(d).toFixed(2) : d;
            }
        );//Vue.filter('price'

    Vue.filter('trunc',function(str, len){
                var trunc = str.slice(0, len || 200);
                if(trunc.length < str.length)trunc +=' ...';
                return trunc;
            }
        );//Vue.filter('trunc'

    APP.app = new Vue({
        name:'VUE',
        el:"main",
        router:router,
        data:{
            available_list:null,
            recomended_list:null,
            myorders_list:null,

            filters:{},
            sorts:{},

            last_order:null,
            is_workstatus_active:false,
            _workstatus_timer:null,

            logedin:false,
            user:null,
            notifies_object:{},
            notifies_ts:2,
            _app_ready:false,

            cnt_available:0,
            cnt_recomended:0,
            cnt_new_messages:0,
            myorders_messages_list:null,

            show_header:false,
            show_footer:false,
            full_height:true,
            children_classes:'',
        },
        created: function(){
            var self = this;
            this.logedin = !!APP.get_state('sessionid');
            if(this.logedin){
                this.prepareapp();
            }else{
                this._login_or_onboard();
            }
            this.$on('filtered', this.filtered );
            this.$on('fetch', function(folder){
                self['fetch_' + folder]();
            } );
        },
        methods:{
            fetch_available:function(fn){
                var self = this;
                this.fetch_folder('available',{},
                    function(data){
                        if(data.orders !== undefined){
                            self.available_list = data.orders;
                            if(fn)fn();
                        }
                    }
                    );
            },
            fetch_recomended:function(fn){
                var self = this;
                this.fetch_folder('recomended',{},
                    function(data){
                        if(data.orders !== undefined){
                            self.recomended_list = data.orders;
                            if(fn)fn();
                        }
                    }
                    );
            },
            fetch_myorders(fn){
                var self = this;
                this.fetch_folder('myorders',{}, function(dataO){
                    // self.myorders_list = dataO.orders;
                    // self._update_myorders_messages_list(fn, dataO);
                    // fn(data);

                    self.myorders_messages_list = null;
                    self.request({
                        url:"/accounts/notifies/?types=messages&at=0",
                        success(dataM){
                            if(dataM.messages_list){
                                self.myorders_messages_list = dataM.messages_list;
                            }
                            self.myorders_list = dataO.orders;
                            self._update_myorders_messages_list(fn, dataM)
                        },
                    });
                });
            },
            _update_myorders_messages_list(fn, data){
                if( this.myorders_messages_list && this.myorders_list ){
                    for(var o of this.myorders_list){
                        for(var m of this.myorders_messages_list){
                            if(o._id == m.order){
                                o._msgs_cnt = (o._msgs_cnt||0) + 1;
                            }
                        }
                    }
                    if(fn)fn(data);
                }
            },
            fetch_folder:function(folder, opt, fn){
                var self=this;
                this.request({
                    url:"/accounts/orders/folder/"+folder+"?_json="+Date.now(),
                    success:function(data){
                        if(data.orders !== undefined){
                            if(fn)fn(data);
                        }
                    }
                });
            },
            filtered(folder, opt){
                if(opt.filters){
                    var filter = {};
                    for(var k in opt.filters){
                        filter[k] = opt.filters[k];
                    }
                    if( Object.keys(filter).length )
                        this.$set(this.filters, folder, filter);
                    else opt.filters = null;
                }
                if(opt.filters === null)this.$delete(this.filters, folder);
                if(opt.sortby){
                    this.$set(this.sorts, folder, opt.sortby);
                }
                if(opt.sortby === null)this.$delete(this.sorts, folder);
            },
            apply_filters(orders, filters){
                if(filters.price_to){
                    orders = orders.filter(function(o){return helpers.writer_price(o) <= filters.price_to; })
                }
                if(filters.price_from){
                    orders = orders.filter(function(o){return helpers.writer_price(o) >= filters.price_from; })
                }
                if(filters.subjects){
                    orders = orders.filter(function(o){return filters.subjects.indexOf(o.subject)>=0; })
                }
                return orders;
            },
            apply_sorts(orders, sorts){
                for(var s of sorts){
                    orders.sort(helpers.orders_sort_keys[s.replace(/^-/,'')]);
                    if(s[0] == '-')orders.reverse();
                }
                return orders
            },
            fetch_user:function(fn){
              var self=this;
                this.request({
                    url:"/accounts/settings/?_json="+Date.now(),
                    success:function(data){
                        if(data.user !== undefined){
                            self.user = data.user;
                            if(fn)fn();
                            self.check_workstatus();
                        }
                    }
                });
            },
            patch_user:function(post){
                if(!this.user)return false;
                var user=this.user || {};
                var self = this;
                this.request({
                    url:"/users/update/"+user._id+"/field",
                    method:'post',
                    data:post,
                    success:function(data){
                        if(data.user){
                            user = data.user;
                        }else{
                            if(data.data){
                                if(data.data.available_for !== undefined){
                                    user.profile.available_for = data.data.available_for;
                                    self.check_workstatus();
                                }
                            }
                        }
                    }
                });
            },
            fetch_notifies(fn){
                var self = this;
                this.request({
                    // url:"/accounts/notifies/?at="+(at?self.notifies_ts:''),
                    url:"/accounts/accounts_notifies/",
                    nooverlay:true,
                    success:function(data){
                        // self.notifies_ts = +data.ts;
                        // self.notifies_object = data;
                        self.cnt_recomended = data.notifies.tasks.recomended;
                        self.cnt_available = data.notifies.tasks.available;
                        self.cnt_new_messages  = data.notifies.tasks.new_messages;
                        if(fn)fn(data);
                    },
                });
            },
            subjects_from_orders(folder){
                var orders = this[folder+'_list'] || this[folder];
                if(!orders || !orders.length)return [];
                var subjects = orders.reduce(function(a,o){ if(a.indexOf(o.subject)==-1)a.push(o.subject);return a; },[]);
                return subjects;
            },
            prepareapp: function(){
                this.show_footer = true;
                this.show_header = true;
                helpers.init({
                    request:this.request,
                });
                this.fetch_available(this._check_ready);
                this.fetch_user(this._check_ready);
                if(this.$route.path == '/login' || this.$route.path == '/'){
                    this.$router.replace('/subjects');
                }
            },
            logout: function(){
                APP.save_state('sessionid',null);
                this.logedin = false;
                this.available_list = null;
                this.myorders_list = null;
                this.user = null;
                // window.location.hash="#";
                // window.location.reload();
                this.$router.replace('/login');
            },
            loging: function(){
                this.logedin = true;
                this.prepareapp();
                this.$router.push('/');
            },
            _login_or_onboard(){
                if(!APP.get_state('onboard')){
                    this.$router.replace('/onboard');
                }else{
                    this.$router.replace('/login');
                }
            },
            _check_ready(){
                var ready = this.user && this.available_list && true;
                if( ready && ! this._app_ready )this.$emit('app_ready');
                this._app_ready = ready;
                return ready;
            },
            start_using(){
                APP.save_state('onboard', Date.now());
                this.$router.replace('/');
            },
            request(opt){
                var self = this;
                var success = opt.success;
                var fail = opt.fail;
                opt.success = function(data, x){
                    self.request_success(data, x, {success:success, fail:fail} );
                }
                opt.fail = function(x){
                    self.request_fail(x, fail);
                }
                return APP.request(opt);
            },
            request_success(data, x, opt){
                if(opt.success)opt.success(data, x);
            },
            request_fail(x, fail){
                console.log('Network Fail', x.status, x)
                if(fail)fail(x);
            },
            check_workstatus(){
                var available_for;
                try{
                    available_for = this.user.profile.available_for && new Date(this.user.profile.available_for).getTime() || null;
                }catch(e){}
                if(available_for){
                    var now = Date.now();
                    if(available_for <= now)available_for = null;
                }
                this.is_workstatus_active = !!available_for;
                if(this._workstatus_timer && !this.is_workstatus_active){
                    clearInterval(this._workstatus_timer);
                }
                if(!this._workstatus_timer && this.is_workstatus_active){
                    this._workstatus_timer = setInterval(this.check_workstatus,5000);
                }
            },
            onTokenRefresh(token){
                if(token)this.patch_user({'profile_app_token':token});
            },
            onNotification(data){
                if(data.wasTapped && data.tag){
                    if(data.tag == 'recomended_writer'){
                        this.$router.push('/recomended/' + data.order);
                    }
                    if(data.tag == 'message'){
                        this.$router.push('/myorders/' + data.order + '/messages');
                    }
                }
            },
        },
        watch:{
            '$route': function(to, from){
                var self = this;
                this.logedin = !!APP.get_state('sessionid');
                if(!this.logedin){
                    this.show_header = false;
                    this.show_footer = false;
                    // this.$router.replace('login');
                    this._login_or_onboard();
                    return;
                }
                this.fetch_notifies(function(){
                    if(self.cnt_recomended && to.matched && /^\/subjects|^\/myorders/.test(to.path)){
                        self.$router.replace({name:'recomended_orders'});
                    }
                });
                this.show_header = true;
                this.show_footer = true;
                this.full_height = false;
            },
            cnt_recomended(val, old){
                this.fetch_recomended();
            },
            cnt_available(val, old){
                if(this.available_list === null || !old)return;
                this.fetch_available();
            }
        },
        computed:{
            route_class(){
                var route_name = this.$route.name || '';
                if (route_name) return 'route_'+route_name;
                return '';
            },
            myorders: function(){
                var self = this;
                if(this.myorders_list === null ){
                    this.myorders_list = [];
                    this.fetch_myorders();
                }
                var orders = this.myorders_list;
                var filters = this.filters.myorders;
                var sorts = this.sorts.myorders;
                if(filters){
                    orders = this.apply_filters(orders, filters);
                }
                if(sorts && sorts.length){
                    orders = this.apply_sorts(orders, sorts);
                }else{
                    orders.sort(function(a,b){
                        function weigth(o){
                            if( helpers.order_status(o) == 'reserved')return 100;
                            if( helpers.order_status(o) == 'in progress' && o._msgs_cnt)return 70;
                            if( helpers.order_status(o) == 'completed' && o._msgs_cnt)return 60;
                            if( helpers.order_status(o) == 'in progress' && !o._msgs_cnt)return 50;
                            if( helpers.order_status(o) == 'completed' && !o._msgs_cnt)return 40;
                            if( o._msgs_cnt)return 30;
                            return 0;
                        }
                        return weigth(b) - weigth(a);
                    });
                }
                return orders;
            },
            recomended(){
                var self = this;
                // if(!this.available_list || !this.user)return[];
                // var orders = this.available_list.filter(function(order){
                //     return order.recomended_writers &&  order.recomended_writers.indexOf(self.user._id)>=0 ;
                // });
                if(!this.recomended_list || !this.user)return[];
                var orders = this.recomended_list;
                return orders;
            },
            available(){
                var orders = this.available_list || [];
                var filters = this.filters.available;
                var sorts = this.sorts.available;
                if(filters){
                    orders = this.apply_filters(orders, filters);
                }
                if(sorts){
                    orders = this.apply_sorts(orders, sorts);
                }
                return orders;
            },
        }
    });//Vue app

    var routes = [];

    routes.push({ path: '/', redirect: '/workstatus' });

    routes.push({ path: '/onboard', component:eOnBoard, name:"onboard" });
    routes.push({ path: '/login', component:eLogin, name:"login" });

    routes.push({path:"/subjects", component:eSubjects, name:'subjects'});
    routes.push({path:"/subjects/__filter__", component:eFilters, props:{ folder:'available', no_filters:true } });
    routes.push({path:"/subjects/:subject", component:eSubjectOrders, props:{ folder:'available' } });
    routes.push({path:"/subjects/:subject/__filter__", component:eFilters, props:{ folder:'available', no_subjects:true } });
    routes.push({path:"/subjects/:subject/:id", component:eOrderDetails, props:{ folder:'available' } });

    routes.push({path:"/recomended", component:eRecomendedOrders, props:{ folder:'recomended' , filter_recomended:true}, name:'recomended_orders' });
    routes.push({path:"/recomended/:id", component:eOrderDetails, props:{ folder:'recomended' } });

    routes.push({path:"/myorders", component:eOrders, props:{ folder:'myorders'}, name:'myorders' });
    routes.push({path:"/myorders/__filter__", component:eFilters, props:{ folder:'myorders'} });
    routes.push({path:"/myorders/:id", component:eOrderDetails, props:{ folder:'myorders'} });
    routes.push({path:"/myorders/:id/messages", component:eOrderDetails, props:{ folder:'myorders', show_messages:true} });

    routes.push({path:"/order/:id", component:eOrderDetails});
    routes.push({path:"/messages/:id", component:eOrderMessages});
    routes.push({path:'/workstatus', component:eWorkStatus });
    routes.push({path:'/more', component:eMore });


    router.addRoutes(routes);

    (function(){
        var mc = new Hammer(document.getElementById('main'));
            mc.on('swipedown', function(){
                if(window.scrollY < 10)
                APP.app.$emit('refresh');
            })
    })()


}//APP_START


document.addEventListener('deviceready', APP_START, false);

FCMPlugin.onTokenRefresh(function(token){
    alert( token );
});
FCMPlugin.getToken(function(token){
    alert(token);
});
FCMPlugin.onNotification(function(data){
    if(data.wasTapped){
      //Notification was received on device tray and tapped by the user.
      alert( JSON.stringify(data) );
    }else{
      //Notification was received in foreground. Maybe the user needs to be notified.
      alert( JSON.stringify(data) );
    }
});
// if(/Mozilla/.test(navigator.userAgent)){
//     document.dispatchEvent(new Event('deviceready'))
// }


(function(){

    if(navigator.userAgent.match(/iPod|iPad|iPhone/i)){
        var h = document.getElementsByTagName('html')[0];
        h.className = h.className +' ios';
    }
    if(navigator.userAgent.match(/android/i)){
        var h = document.getElementsByTagName('html')[0];
        h.className = h.className +' android';
    }
})()

