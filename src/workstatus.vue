<script>
export default {
        name:'WorkStatus',
        props:['user'],
        data:function(){return {
            available:false,
            editing:false,
            sel_hours:0,
            sel_time:[0,0],
            available_for_date:0,
            changed:false,
        }},
        methods:{
            edit_time:function(){
                this.editing = true;
            },
            start_time:function(){
                this.editing = false;
                this.sel_hours = +$(this.$el).find('.drum').val();
                this.sel_time = [this.sel_hours, 0]
                this.changed = true;
            },
            cancel_time:function(){
                this.editing  = false;
            },
            toggle_available(){
                this.available = !this.available;
                this.sel_hours = this.available ? 1:0;
                this.sel_time= [this.sel_hours, 0];
                this.changed = true;
                if(this.available)this.edit_time();
            },
        },
        computed:{
            sel_time_pads(){
                var h = (this.sel_time[0] < 10 ? '0':'') + this.sel_time[0];
                var m = (this.sel_time[1] < 10 ? '0':'') + this.sel_time[1];
                return [h,m];
            },
        },
        mounted(){
            var self = this;
            this.$nextTick(function(){
                $(this.$el).find('.drum').drum({
                    'panelCount':12,
                    'interactive':false,
                });
            });
        },
        created(){
            var self = this;
            var user = this.$root.user;
            if(user){
                self.available_for_date = (user.profile.available_for == 0 || !user.profile.available_for)? 0 : new Date(user.profile.available_for);
            }
            this.$root.fetch_user();
            this.$watch('$root.user', function(user){
                self.available_for_date = (user.profile.available_for == 0 || !user.profile.available_for)? 0 : new Date(user.profile.available_for);
                this.$forceUpdate();
            },{deep:1})
        },
        beforeDestroy(){
            if(this.changed){
                this.$root.patch_user({available_for:this.sel_hours});
            }
        },
        watch:{
            'available_for_date':function(date){
                var now = Date.now();
                if(!date){
                    this.sel_hours = 0;
                    this.sel_time = [0,0];
                }
                else{
                    var tz = 0;//date.getTimezoneOffset();
                    var deltams = date.getTime()-now-tz*60*1000;
                    if( deltams <= 0 )this.sel_hours = 0;
                    else{
                        this.sel_hours = parseInt(deltams/(1000*60*60));
                        this.sel_time = [this.sel_hours, parseInt((deltams-this.sel_hours*1000*60*60)/(1000*60))];
                    }
                }
                this.available = !!(this.sel_hours || this.sel_time[0] || this.sel_time[1]);
                this.$forceUpdate();
            },
        },
    }
</script>




<template>
    <div id="work_status" class="frame-inner">

        <div class="frame-header">
            <p  class="frame-title">Work Status</p>
        </div>

        <div class="txt-block1">Please mention for how long you are available to accept new orders. Your team leaders will use the timer to reach you with the hottest deals that fully match your preferences. You definitely shouldn't miss out on this opportunity!</div>

        <div class="current-status-block" :class="{'not-available':!available, 'available':available}" id="work_status_notavailable_block" v-if="!editing">
            <p class="current-status-title">Current status</p>
            <div class="current-status-checkbox">
                <input type="checkbox" :checked="available" @change="toggle_available" id="status-available">
                <label for="status-available" v-if="!available">Not available</label>
                <label for="status-available" v-if="available">Available</label>
            </div>
            <div class="" v-if="!available">
                <p class="current-status-msg">I'm not ready to accept new orders right now.</p>
            </div>
        <!--/div>

        <div class="current-status-block available" id="work_status_available_block" v-if="available && !editing">
            <p class="current-status-title">Current status</p>
            <div class="current-status-checkbox">
                <input type="checkbox" v-model="available" id="status-available">
                <label for="status-available">Available</label>
            </div-->
            <div class="" v-if="available">
            <p class="current-status-msg">I'm ready to accept new orders and reply to team leaders requests right now.</p>

            <div class="current-status-countdown" >{{sel_time_pads[0]}}<span class="objblink">:</span>{{sel_time_pads[1]}}</div>
            <button class="btn1" type="button" @click="edit_time">Change available period</button>
            </div>
        </div>

        <div class="status-selector" id="work_status_edit_block" :class="{invisible:!editing}">
            <p class="status-selector-title">Available right now for</p>

            <div class="drum-wrapper">
                <select class="drum">
                    <!-- <option value="0">00:00 hours</option> -->
                    <option value="1">01:00 hours</option>
                    <option value="2">02:00 hours</option>
                    <option selected value="3">03:00 hours</option>
                    <option value="4">04:00 hours</option>
                    <option value="5">05:00 hours</option>
                    <option value="6">06:00 hours</option>
                    <option value="7">07:00 hours</option>
                    <option value="8">08:00 hours</option>
                    <option value="9">09:00 hours</option>
                    <option value="10">10:00 hours</option>
                    <option value="11">11:00 hours</option>
                    <option value="12">12:00 hours</option>
                    <option value="13">13:00 hours</option>
                    <option value="14">14:00 hours</option>
                    <option value="15">15:00 hours</option>
                    <option value="16">16:00 hours</option>
                    <option value="17">17:00 hours</option>
                    <option value="18">18:00 hours</option>
                    <option value="19">19:00 hours</option>
                    <option value="20">20:00 hours</option>
                    <option value="21">21:00 hours</option>
                    <option value="22">22:00 hours</option>
                    <option value="23">23:00 hours</option>
                </select>
            </div>

            <div class="bottom-btns clearfix">
                <button class="bottom-btn1" type="button" @click="cancel_time">Cancel</button>
                <button class="bottom-btn2" type="button" @click="start_time">Start</button>
            </div>
        </div>



    </div>
</template>