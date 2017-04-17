<script>
import Orders from './orders.vue'
export default {extends:Orders};
</script>


<template>
<div id="orders_list" class="frame-inner">
    <div class="frame-header">
        <p  class="frame-title">Orders</p>
        <a class="back-link" href="#" @click.prevent="$router.up()"><svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#arrow"></use></svg></a>
        <router-link class="filters-link" :class="{active:is_filter_active}" href="#" v-if="show_filter" to="__filter__" append>Filters</router-link>
    </div>
    <div class="page-inner">
        <p class="page-title">{{filter.subject}} <span class="orders-number">({{orders.length}})</span></p>
        <ul class="order-list">
            <li class="order-list-item" v-for="order in orders">
                <router-link class="order-list-link" :to="order._id" append>
                    <div class="order-list-line1 clearfix">
                        <p class="order-list-title">{{order.title | trunc }}</p>
                        <p class="order-list-price" v-if="writer_price(order)">${{writer_price(order) | price }}</p>
                    </div>
                    <div class="clearfix">
                        <p class="order-list-deadline">{{writer_deadline(order) | datetime }}</p> <!-- date in span -->
                        <p class="order-list-pages">{{order_size(order)}}</p>
                    </div>
                </router-link>
            </li>
        </ul>

        <div class="empty-state no-recommended" v-if="orders.length === 0">
            <div class="svg-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#empty_recommended_icon"></use></svg>
            </div>
            <p class="empty-state-title">Nothing to show</p>
            <p class="empty-state-subtitle">Try to update your work<br>status or contact us directly.</p>
        </div>
    </div>
</div>
</template>