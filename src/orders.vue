<script>
import {order_status, writer_price, writer_deadline, fixed, order_size} from './order_helpers.js'

export default {
    // name:'eOrders',
    // template:'#orders_list_tpl',
    props:['folder','filter_recomended'],
    data:function(){
        return{
            total_orders:0,
            filter:{
                subject:'',
                recomended:false,
            },
            page_title:'My Orders',
            show_filter:true,
            is_filter_active:false,
        }
    },
    created:function(){
        this.init();
        this.is_filter_active = !!this.$root.filters[this.folder];
        this.$root.$on('refresh', this.refresh);
    },
    beforeDestroy(){
        this.$root.$off('refresh', this.refresh);
    },
    methods:{
        init:function(){
            this.filter.subject = '';
            this.filter.recomended = false;
            for(var k in this.$options.propsData){
                var f = k.match(/filter_(\w+)/);
                if(!f)continue;
                f = f[1];
                this.filter[f] = this[k];
            }
            if(this.$route.params.subject){
                this.filter.subject = decodeURIComponent(this.$route.params.subject);
            }
        },
        refresh(){
            this.$root.$emit('fetch', this.folder);
        },
        order_status:order_status,
        order_status_class(order){ return this.order_status(order).toLowerCase().replace(/\s/g,'-'); },
        writer_price(order){
            if(order && order.writer_price && this.folder == 'myorders')return fixed(order.writer_price);
            var price = writer_price(order)
            try{
                if( this.$root.user.profile.group_name === 'gold' ){
                    price *= 1.1;
                }
            }catch(e){}
            return fixed(price);
        },
        writer_deadline:writer_deadline,
        order_size:order_size,
    },
    watch:{
        '$route':function(){
            this.init();
        }
    },
    computed:{
        orders:function(){
            var folder = this.folder || 'available';
            var filter = this.filter;
            var self = this;
            if(!this.$parent[folder])return [];
            var orders = this.$parent[folder];
            if(filter.subject)orders = orders.filter(function(order){return order.subject == filter.subject;});
            // if(filter.recomended)orders = orders.filter(function(order){
            //     return order.recomended_writers &&  order.recomended_writers.indexOf(self.$parent.user._id)>=0 ;
            // });
            return orders;
        }
    }
};
</script>



<template>
<div id="orders_list" class="frame-inner">
    <div class="frame-header">
        <p  class="frame-title">{{page_title}} <span v-if="orders.length">({{orders.length}})</span></p>
        <router-link class="filters-link" :class="{active:is_filter_active}" v-if="show_filter" to="__filter__" append>Filters</router-link>
    </div>

    <div class="page-inner">
            <ul class="my-order-list">
                <li class="my-order-list-item" v-for="(order, index) in orders">
                <router-link class="order-list-link" :to="order._id" append>
                    <div class="my-order-line1 clearfix">
                        <p class="my-order-list-msg" v-if="order._msgs_cnt"><svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#msg_icon"></use></svg><span>{{order._msgs_cnt}}</span></p>
                        <p class="my-order-list-number">{{order.number}}</p>
                        <p class="my-order-list-status" :class="[order_status_class(order)]" v-if="order_status(order)">{{order_status(order)}}</p> <!-- in-progress completed -->
                    </div>
                    <p class="my-order-list-title">{{order.title | trunc }}</p>
                    <div class="my-order-line2 clearfix">
                        <p class="my-order-list-deadline"><span>{{writer_deadline(order) | date }}</span>, {{writer_deadline(order) | time }}</p>
                        <p class="my-order-list-price" v-if="writer_price(order)">${{writer_price(order)|price}}</p>
                    </div>
                    <p class="my-order-list-pages">{{order_size(order)}}</p>
                </router-link>
                </li>

            </ul>

            <div class="empty-state no-recommended" v-if="orders.length === 0 && filter_recomended ">
                <div class="svg-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#empty_recommended_icon"></use></svg>
                </div>
                <p class="empty-state-title">Nothing is recommended</p>
                <p class="empty-state-subtitle">Try to update your work<br>status or contact us directly.</p>
            </div>

            <div class="empty-state no-orders" v-if="orders.length === 0 && folder == 'myorders' ">
                <div class="svg-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#empty_no_orders_icon"></use></svg>
                </div>
                <p class="empty-state-title">You don’t have<br> any orders yet</p>
                <p class="empty-state-subtitle">Please check available<br> orders feed.</p>
            </div>


        </div>
</div>
</template>