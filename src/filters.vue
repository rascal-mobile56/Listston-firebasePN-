<script>
export default {
    props:['folder', 'no_subjects', 'no_filters', 'prefilters'],
    data(){return{
        filter_price_from:'',
        filter_price_to:'',
        filter_sortby:'',
        subjects:[],
        filter_subjects:[],
    }},
    created(){
        var self = this;

        this.load_filter(
            this.$root.filters[this.folder],
            this.$root.sorts[this.folder]
            )

        self.subjects = self.$root.subjects_from_orders(self.folder);
        // self.check_all_subjects();

        this.$watch('filter_subjects', this._filtered);
        this.$watch('filter_price_from', this._filtered);
        this.$watch('filter_price_to', this._filtered);
    },
    beforeUpdate(){
        // setTimeout(this.apply_filter, 500);
    },
    methods:{
        sortby(by){
            this.filter_sortby = by;
        },
        clear(){
            this.filter_price_to = '';
            this.filter_price_from = '';
            this.filter_sortby = '';
            // check_all_subjects();
            this.filter_subjects = [];
        },
        close(){
            this.clear();
            this.apply_filter();
            this.$router.up();
        },
        check_all_subjects(){
            this.filter_subjects = this.subjects.slice(0);
        },
        toggle_subject(subject){
            var i = this.filter_subjects.indexOf(subject);
            if(i==-1){
                this.filter_subjects.push(subject);
            }else{
                this.filter_subjects.splice(i,1);
            }
        },
        filter_subjects_checked(subject){
            return this.filter_subjects.indexOf(subject) >= 0;
        },
        apply_filter(){
            var filters = {}, sortby=null;
            if(this.filter_price_to)filters['price_to'] = this.filter_price_to;
            if(this.filter_price_from)filters['price_from'] = this.filter_price_from;
            if(this.filter_subjects && this.filter_subjects.length)filters['subjects'] = this.filter_subjects;
            if(this.filter_sortby)sortby = [this.filter_sortby];
            this.$root.$emit('filtered', this.folder, {filters, sortby});
        },
        _filtered(){
            this.$nextTick(()=>this.apply_filter() );
        },
        load_filter(filters, sorts){
            if(filters){
                if(filters.price_to)this.filter_price_to=filters.price_to;
                if(filters.price_from)this.filter_price_from=filters.price_from;
                if(filters.subjects)this.filter_subjects = filters.subjects;
            }
            if(sorts && sorts.length)this.filter_sortby = sorts[0];
        },
        save(){
            this.apply_filter();
            this.$router.up();
        },
    },
    computed:{
        orders_count(){
            var f = this.$root[this.folder];
            if(!f || !f.length)return 0;
            return f.length;
        },
        filter_price_to_error(){
            if(this.filter_price_to === '')return 0;
            if(this.filter_price_to !== '' &&  isNaN(parseInt(this.filter_price_to)))return 1;
            if(isNaN(parseInt(this.filter_price_from)) )return 0;
            if( parseInt(this.filter_price_from) >= parseInt(this.filter_price_to) )return 1;
            if( this.filter_price_to < 0 )return 1;
        },
        filter_price_from_error(){
            if(this.filter_price_from === '')return 0;
            if(this.filter_price_from !== '' &&  isNaN(parseInt(this.filter_price_from)))return 1;
            if(isNaN(parseInt(this.filter_price_to)) )return 0;
            if( parseInt(this.filter_price_to) <= parseInt(this.filter_price_from) )return 1;
            if( this.filter_price_from < 0 )return 1;
        },
        some_error(){
            return this.filter_price_to_error || this.filter_price_from_error;
        }
    },
    watch:{
    },
}
</script>




<template>
    <div class="frame-inner">
    <div class="frame-header">
        <p class="frame-title">Orders</p>
        <a class="close-link" href="#" @click.prevent="close"><svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#close"></use></svg></a>
    </div>
    <div class="page-inner">
        <div class="filters-title-block clearfix">
            <p class="filters-title">Filters</p>
            <a class="clear-filters-btn" href="#" @click.prevent="clear"><svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#close_icon"></use></svg>Clear filters</a>
        </div>
        <p class="filters-subtitle" v-if="!no_filters">Sort by</p>
        <ul class="filters-sort-list">
            <li class="filters-sort-list-item clearfix" v-if="!no_filters">
                <p class="filters-sort-list-label">Deadline</p>
                <ul class="filters-radio clearfix">
                    <li><input type="radio" id="deadline-radio1" name="sortby" :checked="filter_sortby == 'deadline'" @click="sortby('deadline')"><label for="deadline-radio1"></label></li>
                    <li><input type="radio" id="deadline-radio2" name="sortby" :checked="filter_sortby == '-deadline'" @click="sortby('-deadline')"><label checked for="deadline-radio2"></label></li>
                </ul>
            </li>
            <li class="filters-sort-list-item clearfix" v-if="!no_filters">
                <p class="filters-sort-list-label">Price</p>
                <ul class="filters-radio clearfix">
                    <li><input type="radio" id="price-radio1" name="sortby" :checked="filter_sortby == 'price'" @click="sortby('price')"><label for="price-radio1"></label></li>
                    <li><input type="radio" id="price-radio2" name="sortby" :checked="filter_sortby == '-price'" @click="sortby('-price')"><label for="price-radio2"></label></li>
                </ul>
            </li>
            <li class="filters-sort-list-item clearfix" v-if="!no_filters">
                <p class="filters-sort-list-label">Number of pages</p>
                <ul class="filters-radio clearfix">
                    <li><input type="radio" id="pages-radio1" name="sortby" :checked="filter_sortby == 'pages'" @click="sortby('pages')"><label for="pages-radio1"></label></li>
                    <li><input type="radio" id="pages-radio2" name="sortby" :checked="filter_sortby == '-pages'" @click="sortby('-pages')"><label for="pages-radio2"></label></li>
                </ul>
            </li>
            <li class="filters-sort-list-item price clearfix">
                <p class="filters-sort-list-label">Price</p>
                <ul class="filters-price-range clearfix">
                    <li class="clearfix"><span>$</span><input type="text" class="filters-input" :value="filter_price_from" @input="filter_price_from = $event.target.value" :class="{error:filter_price_from_error}"></li>
                    <li class="clearfix"><span>-</span></li>
                    <li class="clearfix"><span>$</span><input type="text" class="filters-input" :value="filter_price_to" @input="filter_price_to = $event.target.value" :class="{error:filter_price_to_error}"></li>
                </ul>
            </li>
        </ul>

        <div class="" v-if="!no_subjects && subjects.length">
        <p class="filters-subtitle">Select subject <a class="check-all-btn" href="#" @click.prevent="check_all_subjects">Check all</a></p>
        <ul class="filters-select-list">
            <li class="filters-subject-list-item" v-for="(subject, index) in subjects">
                <input type="checkbox" :id="'subject' + index" :value="subject" :checked="filter_subjects_checked(subject)" @change.prevent="toggle_subject(subject)">
                <label :for="'subject' + index" class="filters-subject-list-checkbox-label">
                    <svg class="checkbox-on" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#checkbox-selected"></use></svg>
                    <svg class="checkbox-off" xmlns="http://www.w3.org/2000/svg"><use xlink:href="#checkbox-unselected"></use></svg>
                    <span>{{subject}}</span>
                </label>
            </li>
        </ul>
        </div>

        <div class="bottom-btns">
            <button class="bottom-btn3" type="button" @click="save" :disabled.prop="some_error || !orders_count">Apply filters <span>({{orders_count}})</span></button>
        </div>
    </div>
    </div>
</template>