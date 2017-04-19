"use strict"

function query(obj){
    var q = "";
    for(var k in obj){
        q +=k + "=" + String(obj[k]) + "&";
    }
    return q.replace(/&$/,'');
}

function request(opt){
    opt = opt || {};
    var x = new XMLHttpRequest();
    if(opt.url && opt.url[0]=='/')opt.url = APP.baseUrl + opt.url
    x.open(opt.method||'get',opt.url,1);
    x.onreadystatechange = function() {
        if (x.readyState == 4) {
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
    if(/post/i.test(opt.method)){
        x.setRequestHeader('Content-Type','application/x-www-form-urlencoded' );
        if(APP.STATE.csrftoken){
            x.setRequestHeader("X-CSRFToken", APP.STATE.csrftoken);
            if(opt.data && typeof opt.data =='object')opt.data['csrfmiddlewaretoken']=APP.STATE.csrftoken;
        }
    }
    else x.setRequestHeader('Content-Type','text/html' );
    if(APP.STATE.sessionid)x.setRequestHeader('X-Token', APP.STATE.sessionid);
    if(opt.headers)for(var k in opt.headers){ x.setRequestHeader(k, opt.headers[k]); }
    // x.withCredentials = true;
    if(opt.data && typeof opt.data =='object')opt.data = query(opt.data);
    x.send(opt.data||null);
    return x;
}
// X-CSRFToken csrftoken csrfmiddlewaretoken

function Model(extend){
    var fn = function(obj){
        this._model = obj;
        var keys = Object.keys(obj), self=this;
        for(var ik in keys){
            (function(){
                var k = keys[ik];
            Object.defineProperty(self, k,{
                enumerable:true,
                get:function(){
                    return self._model[k]; },
                set:function(v){
                    self._model[k] = v; }
            })
            })();
        }
    }
    fn.prototype = extend || {};
    return fn;
}


var APP = {
    baseUrl : "http://writer.tn-company.com:3010",
    STATE:{},
    get_state : function(k){
        if(!APP.STATE)APP.load_state();
        return APP.STATE[k];
    },
    load_state : function(){
        APP.STATE = JSON.parse(localStorage['APPSTATE']||"{}");
    },
    save_state : function(k, v){
        if(k)APP.STATE[k]=v;
        if(!APP.STATE)APP.load_state();
        localStorage['APPSTATE'] = JSON.stringify(APP.STATE);
    }
};

function APP_START(){

    APP.load_state();

    APP.auth = function(email, passwd, success, fail){
        request({
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

    Vue.filter('datetime',function(d){
                var d = new Date(d);
                return d.toString();
            }
        );//Vue.filter('datetime'

    APP.app = new Vue({
        name:'VUE',
        el:"main",
        router:router,
        data:{
            available:null,
            last_order:null,
            logedin:false,
            user:null,

            show_header:false,
            show_footer:false,
        },
        created: function(){
            this.logedin = !!APP.get_state('sessionid')
            if(this.logedin){
                this.prepareapp();
            }else{
                this.$router.replace('/login');
            }
        },
        methods:{
            fetch_available:function(fn){
                var self=this;
                request({
                    url:"/accounts/orders/folder/available?_json="+Date.now(),
                    success:function(data){
                        if(data.orders !== undefined){
                            self.available = data.orders;
                            if(fn)fn();
                        }
                    }
                });
            },
            fetch_user:function(fn){
              var self=this;
                request({
                    url:"/accounts/settings/?_json="+Date.now(),
                    success:function(data){
                        if(data.user !== undefined){
                            self.user = data.user;
                            if(fn)fn();
                        }
                    }
                });
            },
            patch_user:function(post){
                var self=this;
                request({
                    url:"/users/update/"+this.user._id+"/field",
                    method:'post',
                    data:post,
                    success:function(data){
                        console.log(data);
                    }
                });
            },
            prepareapp: function(){
                this.show_footer = true;
                this.show_header = true;
                this.fetch_available();
                this.fetch_user();
                if(this.$route.path == '/login' || this.$route.path == '/'){
                    this.$router.replace('/subjects');
                }
            },
            logout: function(){
                APP.save_state('sessionid',null);
                this.logedin = false;
                this.available = null;
                // window.location.hash="#";
                // window.location.reload();
                this.$router.replace('/login');
            },
            loging: function(){
                this.logedin = true;
                this.prepareapp();
                this.$router.push('/subjects');
            }
        },
    });//Vue app

    var routes = [];

    routes.push({ path: '/', redirect: '/subjects' });


    var eLogin = {
        template:'#index_login_form_tpl',
        data:function(){ return {
            email:'',
            password:'',
            error:false,
        }},
        methods:{
            submit:function(){
                this.error = '';
                var self = this;
                if(this.email && this.password){
                    APP.auth(this.email, this.password,
                        function(){
                            self.$parent.loging();
                        },
                        function(){self.fail("Incorrect email or password.")}
                        );
                }
                else{ this.fail("Enter details"); }
            },
            fail: function(text){
                this.error = text;
            },
            onInput : function(){
                this.error = "";
            }
        },
        watch:{
            'email':'onInput',
            'password':'onInput',
        },
    };
    routes.push({ path: '/login', component:eLogin });


    function orders2subjects(orders){
        var subjects = {}, subjects_list = [], total_orders = 0;
        orders.forEach(function(order, i){
            var subject = order.subject || 'Other';
            if(!subjects[subject]){
                subjects[subject] = {ids:[],numbers:[],count:0,title:subject};
                subjects_list.push(subjects[subject]);
            }
            subjects[subject].ids.push(order._id);
            subjects[subject].numbers.push(order.number);
            subjects[subject].count++;
            total_orders++;
        });
        return {subjects:subjects_list, total_orders:total_orders};
    }
    // '$route' (to, from) {
    // $route.params.id

    var eSubjects = {
        name:'eSubjects',
        template:'#orders_subjects_list_tpl',
        data:function(){
            return{
                total_orders:0,
            }
        },
        created:function(){
        },
        computed:{
            subjects: function(){
                this.total_orders = 0;
                if(!this.$parent.available)return [];
                var v = orders2subjects(this.$parent.available);
                this.total_orders = v.total_orders;
                return v.subjects;
            }
        }
    };
    routes.push({path:"/subjects", component:eSubjects});

    var eSubjectOrders = {
        name:'eSubjectOrders',
        template:'#orders_list_tpl',
        data:function(){
            return{
                total_orders:0,
            }
        },
        created:function(){
        },
        computed:{
            orders:function(){
                if(!this.$parent.available)return [];
                var subject = decodeURIComponent(this.$route.params.subject);
                var orders = this.$parent.available.filter(function(order){return order.subject == subject;});
                return orders;
            }
        }
    };
    routes.push({path:"/subject/:subject", component:eSubjectOrders});

    var eOrderDetails = {
        name:'eOrderDetails',
        template:'#order_details_tpl',
        computed:{
            order:function(){
                if(!this.$parent.available)return {};
                var id = this.$route.params.id;
                var order = this.$parent.available.find(function(o){return o._id == id;});
                this.$parent.last_order = order;
                return order || {};
            }
        }
    }
    routes.push({path:"/order/:id", component:eOrderDetails});

    var eOrderMessages = {
        name:'eOrderMessages',
        template:'#order_messages_list_tpl',
        data:function(){
            return {
                order_id:null,
                messages:[],
                new_message:'',
                new_recepient:'operator',
            }
        },
        computed:{
            order:function(){
                var order_id = this.order_id;
                var order = { _id:order_id };
                if(!this.$parent.available)return order;
                order = this.$parent.available.find(function(o){return o._id == order_id;}) || order;
                return order;
            }
        },
        methods:{
            send:function(){
                var msg = {
                    message:this.new_message,
                    sender_role:'writer',
                    created_at:new Date(),
                    order_id:this.order_id,
                }
                this.messages.push(msg);
                request({
                    url:"/messages/",
                    method:'post',
                    // data:JSON.stringify(msg),
                    data:msg
                });
                this.new_message = '';
            },
            fetch: function(){
                var self = this;
                var order_id = this.order_id;
                request({
                    url:"/orders/messages/"+order_id+"?_json=1",
                    success:function(data){
                        if(data.messages){
                            self.messages = data.messages;
                        }
                    }
                });
            }
        },
        created:function(){
            this.order_id = this.$route.params.id;
            this.fetch();
        }
    }
    routes.push({path:"/messages/:id", component:eOrderMessages});

    routes.push({path:'/workstatus', component:{
        name:'WorkStatus',
        template:'#work_status_tpl',
        props:['user'],
        data:function(){return {
            available:false,
            editing:false,
        }},
        methods:{
            edit_time:function(){
                this.editing = true;
            },
            start_time:function(){
                this.editing = false;
            },
            cancel_time:function(){
                this.editing  = false;
            },
        }
    }});//


    router.addRoutes(routes);


}//APP_START


document.addEventListener('deviceready', APP_START, false);

if(/Mozilla/.test(navigator.userAgent)){
    document.dispatchEvent(new Event('deviceready'))
}
setTimeout(function(){document.dispatchEvent(new Event('app_start'));},0);