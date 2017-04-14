<script>
export default {
    data:function(){return{
        show_logout_modal:false,
    }},
    computed:{
        user(){
            return this.$root.user || {};
        }
    },
    methods:{
        logout_confirm(){
            this.$root.logout();
        },
    },
}
</script>



<template>
    <div  class="frame-inner">
    <div class="frame-header">
        <p class="frame-title">More</p>
    </div>

    <div class="page-inner">
        <p class="more-signed">You signed in as</p>
        <p class="more-title">{{user.name}}</p>
        <button id="#logout" class="logout-btn" type="button" @click="show_logout_modal = true">Logout</button>
        <div class="more-txt1">Is something missing? This mobile version has limited functional for now. The full version is still available from a computer, please visit <a class="link" href="http://livingston-research.com">livingston-research.com</a></div>
        <div class="more-txt2">If you have any questions or need<br> assistance, please, make sure to contact<br> your Team Leaders (available 24/7):</div>
        <ul class="more-contact-list">
            <li><span class="more-contact-list-label">E-Mail: </span><a class="link" href="mailto:support@liv-research.com">support@liv-research.com</a></li>
            <li><span class="more-contact-list-label">Skype: </span><a class="link" href="skype:livingston_research">livingston_research</a></li>
            <li class="clearfix"><span class="more-contact-list-label call-us">Call us: </span>
                <p class="link-block">
                    <a class="link" href="tel:+380957362473">+38 (095) 736-24-73</a>
                    <a class="link" href="tel:+74991123285">+7 (499) 112-32-85</a>
                </p>
            </li>
        </ul>
        <a class="more-pp-link" href="http://livingston-research.com/app_policy" target="_blank">Privacy Policy</a>
    </div>

    <div class="modal2" v-if="show_logout_modal">
        <div class="modal2-question-block">
            <p class="modal2-question-msg">Are you sure to logout?</p>
            <ul class="modal2-question-btn-block clearfix">
                <li><button class="modal2-question-btn1" @click="show_logout_modal = false">Cancel</button></li>
                <li><button class="modal2-question-btn2" @click="logout_confirm">Logout</button></li>
            </ul>
        </div>
    </div>

    </div>
</template>