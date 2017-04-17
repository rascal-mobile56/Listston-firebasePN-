<script>
export default {
        // template:'#index_login_form_tpl',
        data:function(){ return {
            email:'',
            password:'',
            error:false,
            email_error:false,
            password_error:false,
        }},
        methods:{
            submit:function(){
                this.error = '';
                this.email_error = false;
                this.password_error= false;
                var self = this;
                if(this.email && this.password){
                    APP.auth(this.email, this.password,
                        function(){
                            self.$root.loging();
                        },
                        function(){
                            self.fail("Incorrect email or password.");
                            self.password_error = true;
                        }
                        );
                }
                else{
                    this.password_error = !this.password;
                    this.email_error = !this.email;
                    this.fail("Enter details");
                }
            },
            fail: function(text){
                this.error = text;
            },
            onInput : function(){
                this.error = "";
                this.email_error = false;
                this.password_error= false;
            },
            restore:function(){
                this.email_error = false;
                this.password_error= false;
                this.error = '';
                if(this.email){
                    this.$root.request({
                        url:"/accounts/restore/",
                        method:'post',
                        data:encodeURI("role=writer&email="+this.email),
                    });
                    this.fail("Check you email for password restore instructions.");
                    this.email_error = true;
                }
                else{ this.fail("Enter you email"); }
            }
        },
        watch:{
            'email':'onInput',
            'password':'onInput',
        },
    };
</script>



<template>
    <div class="padd login-frame frame-inner">
        <div class="logo-img"><svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#bird"></use></svg></div>
        <p class="login-title">Enter your account</p>
        <form method="POST" class="form-block" id="index_login_form">
            <ul class="form-list error">
                <li class="form-list-error-msg" v-if="error">{{error}}</li>
                <li class="form-list-item" :class="{error:email_error}">
                    <input class="form-list-input" name="email" placeholder="Email" value="" type="email" v-model.trim="email">
                </li>
                <li class="form-list-item" :class="{error:password_error}">
                    <input class="form-list-input" name="password" placeholder="Password" type="password" v-model="password">
                </li>
                <li class="form-list-btn">
                    <button class="form-list-btn1" type="button" id="index_login_button" v-on:click="submit">Login</button>
                </li>
                <li class="form-list-checkbox">
                    <input type="checkbox" id="remember">
                    <label for="remember" class="form-list-checkbox-label">
                        <svg class="checkbox-on" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#checkbox-unselected"></use></svg>
                        <svg class="checkbox-off" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#checkbox-selected"></use></svg>
                        <span>Remember me on this device</span>
                    </label>
                </li>
            </ul>
        </form>
        <div class="form-list-bottom">
            <a class="form-list-link" href="#" @click.prevent="restore">Restore password</a>
        </div>
    </div>
</template>