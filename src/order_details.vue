<script>
import {order_status, writer_deadline, writer_price, fixed, order_size} from './order_helpers.js'
import eMessages from './order_messages.vue'

export default {
    name:'eOrderDetails',
    props:['folder','id','show_messages'],
    // template:'#order_details_tpl',
    components:{'order-messages':eMessages},
    data(){return{
        _order:null,
        order_id:null,
        _order_index:null,
        show_order_messages:false,
        not_interested_modal:false,
        writer_report_message:'',
        writer_report_reason_comment:'',
        writer_report_reason_tag:'',
        forbidden_modal:false,
        is_less_details:true,
        is_no_more_details:false,
        show_order_files:false,
    }},
    created(){
        this.order_id = this.$route.params.id || this.id;
    },
    mounted(){
        if(this.show_messages)this.show_order_messages = true;
    },
    computed:{
        order:function(){
            var id = this.order_id;
            if(this._order && this._order._id == id)return this._order;
            if(!this.$parent[this.folder])return {};
            var index;
            var order = this._order = this.$parent[this.folder].find(function(o, i){index=i;return o._id == id;});
            this._order_index = index;
            this.$parent.last_order = order;
            if(!order || !order.details)this.is_no_more_details = true;
            return order || {};
        },
        assigned(){
            return this.$parent.user && this.order.writer == this.$parent.user._id && this.order.tags.indexOf('writer_accept')>=0;
        },
        reserved(){
            return this.order.tags && this.order.tags.indexOf('reserve_order')>=0 && this.order.writer;
        },
        status(){
            return order_status(this.order);
        },
        not_interested_valid(){
            return !!this.writer_report_reason_tag;
        },
        details(){
            if(!this.order || !this.order.details)return '';
            if(this.is_less_details)return this.less_details;
            return this.order.details;
        },
        less_details(){
            if(!this.order || !this.order.details)return '';
            var less = this.order.details.slice(0,500);
            this.is_no_more_details = less.length == this.order.details.length
            if( this.is_no_more_details )return less;
            less.replace(/\w+$/,'...');
            return less;
        },
        writer_deadline(){
            return writer_deadline(this.order);
        },
        writer_price(){
            var order = this.order;
            if(order && order.writer_price && this.folder == 'myorders')return fixed(order.writer_price);
            var price = writer_price(order)
            try{
                if( this.$root.user.profile.group_name === 'gold' ){
                    price *= 1.1;
                }
            }catch(e){}
            return fixed(price);
        },
        order_size(){return order_size(this.order)},
    },
    methods:{
        fetch(){
            var self = this;
            this.$root.request({
                url:"/accounts/orders/"+this.order._id+"/writer?_json=1&_files",
                fail:(x)=>this.action_fail('fetch', x),
                success:(data, x)=>this.action_success('fetch', data, x),
            });
        },
        action(tag, opt){
            var self = this;
            this.$root.request({
                method:'post',
                url:"/accounts/orders/"+this.order._id+"/writer?_json=1",
                data:Object.assign({}, {action:tag}, opt),
                fail:(x)=>this.action_fail(tag, x),
                success:(data, x)=>this.action_success(tag, data, x),
            });
        },
        action_fail(tag, x){
            if(x.status == 403){
                this.forbidden_modal = true;
            }
        },
        action_success(tag, data, x){
            if(data.order && data.order._id == this.order._id){
                Object.assign(this._order, data.order);
                if(data.files_set)this._order.files_set = data.files_set;
                if(this.folder == 'available' && tag == 'accept'){
                    this.$parent[this.folder].splice(this._order_index,1);
                }
            }
        },
        not_interested(){
            this.not_interested_modal = true;
            this.writer_report_message = '';
            this.writer_report_reason_tag = '';
        },
        writer_report_send(){
            this.not_interested_modal = false;
            this.action(this.writer_report_reason_tag, {
                comment:this.writer_report_reason_comment + ' ' + this.writer_report_message,
                reset_recomended_writer:true,
            });
            this.writer_report_message = '';
            this.$parent[this.folder].splice(this._order_index,1);
            this.$router.up();
        },
        writer_report_reason(tag, comment){
            this.writer_report_reason_tag = tag;
            this.writer_report_reason_comment = comment;
        },
        forbidden_modal_close(){
            this.$router.back();
        },
        togle_less_details(){
            this.is_less_details = !this.is_less_details;
        },
    },
    watch:{
        show_order_messages(val){
            this.$parent.show_footer = !val;
        },
        show_order_files(val){
            if(val && !this._order.files_set)this.fetch();
        }
    },
}
</script>



<template>
<div id="order_details" class="frame-inner">
    <div class="frame-header">
        <p  class="frame-title">{{order.number}}</p>
        <a class="back-link" href="" @click.prevent="$router.up()"><svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#arrow"></use></svg></a>
        <!--<a class="close-link" href="#"><svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#close"></use></svg></a>-->
        <!--<a class="filters-link" href="#">Filters</a>-->
    </div>

    <div class="page-inner">
        <div class="top-btns clearfix" v-if="assigned">
            <button class="top-btn1" :class="{'active':!show_order_messages}" type="button" @click="show_order_messages=false">Details</button>
            <button class="top-btn2" :class="{'active':show_order_messages, 'news':order._msgs_cnt}" type="button" @click="show_order_messages=true">Messages</button><!-- .news .active -->
        </div>

        <div class="" v-show="!show_order_messages">
        <p class="order-status" :class="{'in-progress':status=='in progress', 'completed':status=='completed' }" v-if="status"><span>{{status}}</span></p>

        <p class="order-details-subject">{{order.subject}}</p>
        <p class="order-details-title">{{order.title}}</p>
        <ul class="order-details-list">
            <li class="order-details-list-item"><span class="order-details-list-label">Size:</span> {{order_size}}</li>
            <li class="order-details-list-item"><span class="order-details-list-label">Deadline:</span> {{writer_deadline | datetime}}</li>
            <li class="order-details-list-item"><span class="order-details-list-label">Type:</span> Essay (writing)</li>
            <li class="order-details-list-price">Price: ${{writer_price | price}}</li>
        </ul>
        <div class="order-details-desc-block">
            <p class="order-details-desc-label">Description</p>
            <div class="order-details-desc-msg">{{details}}
                <span class="order-details-desc-show-more" v-if="is_less_details && !is_no_more_details" @click="togle_less_details">Show more</span>
                <span class="order-details-desc-show-more" v-if="!is_less_details && !is_no_more_details" @click="togle_less_details">Show less</span>
            </div>
        </div>

        <div class="attached-files-block" v-if="order.attachment && order.attachment.length">
            <ul class="attached-files-list" v-if="show_order_files">
                <li class="attached-files-list-item" v-for="file in _order.files_set"><svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#clip_icon"></use></svg><a class="attached-file-name" :href="file.location" target="_blank">{{file.file}}</a></li>

            </ul>
            <button class="btn2 attached-files-btn" type="button" v-if="!show_order_files" @click="show_order_files=true">Show all attached files</button>
        </div>

        </div>

        <order-messages v-if="show_order_messages" :order_id="order_id" ></order-messages>
    </div>

    <div class="bottom-btns-block"  v-if="!assigned && reserved && !show_order_messages">
        <div class="bottom-btns clearfix" >
            <button class="bottom-btn1" type="button" @click="not_interested">Not Interested</button>
            <button class="bottom-btn2" type="button" @click="action('accept')">Accept</button>
        </div>
    </div>
    <!--div class="bottom-btns clearfix" v-if="!assigned && !reserved && !show_order_messages">
        <button class="bottom-btn1" type="button" @click="action('reserve')">Reserve</button>
        <button class="bottom-btn2" type="button" @click="action('accept')">Accept</button>
    </div-->

    <div class="bottom-btns-block"  v-if="!assigned && !reserved && !show_order_messages">
        <div class="bottom-btns clearfix">
            <button class="bottom-btn1" type="button" @click="action('reserve')">Reserve</button>
            <button class="bottom-btn2" type="button" @click="action('accept')">Accept</button>
        </div>
        <button class="link-btn" type="button" @click="not_interested" v-if="folder == 'recomended'">Sorry, not interested</button>
    </div>


    <div class="modal" v-if="not_interested_modal">
        <div class="modal-let-us-know">
            <p class="modal-let-us-know-title">Please let us know<br> what’s missing</p>
            <ul class="modal-radio-block">
                <li>
                    <input type="radio" id="modal-radio1" name="missing" @click="writer_report_reason('writer_report','Not my field of expertise')"><label for="modal-radio1">Not my field of expertise</label>
                    <svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#tick_icon2"></use></svg>
                </li>
                <li>
                    <input type="radio" id="modal-radio2" name="missing" @click="writer_report_reason('report_missing_files','Lack of files')"><label for="modal-radio2">Lack of files</label>
                    <svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#tick_icon2"></use></svg>
                </li>
                <li>
                    <input type="radio" id="modal-radio3" name="missing" @click="writer_report_reason('writer_report','Deadline is too short')"><label for="modal-radio3">Deadline is too short</label>
                    <svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#tick_icon2"></use></svg>
                </li>
            </ul>
            <textarea class="modal-textarea" placeholder="Put your message here" @input="writer_report_message = $event.target.value"></textarea>

            <button class="btn4" type="button" @click="writer_report_send" :disabled="!not_interested_valid">Submit</button>
        </div>
    </div>

    <div class="modal" v-if="forbidden_modal">
        <div class="modal-too-late">
            <svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#too_late_icon"></use></svg>
            <p class="modal-too-late-title">It’s too late</p>
            <p class="modal-too-late-subtitle">This order is already accepted by someone else.</p>
            <button class="btn3" type="button" @click="forbidden_modal_close">Close</button>
        </div>
    </div>



</div>
</template>