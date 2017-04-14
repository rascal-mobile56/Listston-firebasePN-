<script>
export default {
    name:'eSubjects',
    // template:'#orders_subjects_list_tpl',
    data:function(){
        return{
            total_orders:0,
            is_filter_active:false,
        }
    },
    created:function(){
        this.is_filter_active = !!this.$root.filters['available'];
        this.$root.$on('refresh', this.refresh);
    },
    beforeDestroy(){
        this.$root.$off('refresh', this.refresh);
    },
    computed:{
        subjects: function(){
            this.total_orders = 0;
            if(!this.$parent.available)return [];
            var v = orders2subjects(this.$parent.available);
            this.total_orders = v.total_orders;
            return v.subjects.sort(function(a,b){ return a.title > b.title });
        }
    },
    methods:{
        refresh(){
            this.$root.$emit('fetch', 'available');
        },
    }
}

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
</script>



<template>
<div id="orders_subjects_list" class="frame-inner">
    <div class="frame-header">
        <p  class="frame-title">Orders</p>
        <!--<a class="back-link" href="#"><svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#arrow"></use></svg></a>-->
        <!--<a class="close-link" href="#"><svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#close"></use></svg></a>-->
        <router-link class="filters-link" :class="{active:is_filter_active}"   to="__filter__" append>Filters</router-link>
    </div>
    <div class="page-inner">
        <p class="page-title">Available orders <span class="orders-number">({{total_orders}})</span></p>
        <ul class="subject-list">
            <li class="subject-list-item" v-for="subject in subjects">
                <router-link :to="'/subjects/'+ encodeURIComponent(subject.title) " class="subject-list-link">
                    <p class="subject-list-title">{{subject.title}}</p>
                    <p class="subject-list-count">{{subject.count}}</p>
                </router-link>
            </li>
        </ul>
    </div>
</div>
</template>