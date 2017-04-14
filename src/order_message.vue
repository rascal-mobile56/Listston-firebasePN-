<script>
export default {
    props:['msg'],
    created(){
    },
    data:function(){return{
        show_files_list:false,
        files_set:null,
    }},
    methods:{
        fetch_message(){
            var self = this;
            this.$root.request({
                url:'/messages/'+this.msg._id,
                success:function(data){
                    if(data.message && data.message._id){
                        self.msg = Object.assign(self.msg, data.message);
                    }
                    if(data.files){
                        self.msg.files_set = data.files;
                        self.files_set = data.files;
                    }
                    self.$forceUpdate();
                }
            });
        },
        show_files(){
            this.show_files_list = !this.show_files_list;
            if(!this.files_set )this.fetch_message();
        },
        set_status(status){
            var self = this;
            this.msg.status = {'read':1,'unread':0}[status];
            this.$root.request({
                url:'/messages/status/'+this.msg._id,
                method:'post',
                nooverlay:true,
                data:{status},
                success:function(data){
                }
            });
        },
    },
    computed:{
        sender_class(){
            if(this.sender_role == 'writer')return 'writer';
            if(!this.sender_role)return 'system';
            return this.sender_role;
        },
        sender_role(){
            var role = this.msg.sender_role || 'system';
            var role_map = {'pregrader':'grader'};
            return role_map[role] || role;
        },
        recepient_role(){
            var role = this.msg.recepient_role;
            var role_map = {'pregrader':'grader'};
            return role_map[role] || role;
        },
        is_answer(){
            return this.sender_role == 'writer';
        },
        files_count(){
            return (this.msg.attachment || []).length;
        },
    },
}




</script>



<template>
    <li class="msg-list-item" :class="[sender_class, {answer:is_answer}]">
        <p class="msg-author" v-if="!is_answer">{{sender_role}}</p>
        <p class="msg-author" v-if="is_answer"><svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#answer_icon"></use></svg> to {{recepient_role}}</p>
        <div class="msg-block">
            <div class="msg-txt">
                {{msg.message}}
            </div>
            <ul class="attached-files-list" v-if="files_count && !show_files_list">
                <li class="attached-files-list-item"><svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#clip_icon"></use></svg><span class="attached-file-name" @click="show_files">Show {{ files_count }} files</span></li>
            </ul>
            <ul class="attached-files-list" v-if="files_count && show_files_list && files_set">
                <li class="attached-files-list-item" v-for="file in files_set"><svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#clip_icon"></use></svg><a class="attached-file-name" :href="file.location" target="_blank">{{file.file}}</a></li>
            </ul>
        </div>
        <div class="msg-item-bottom clearfix">
            <button class="read-btn unread" v-if="msg.status==1 && !is_answer" @click="set_status('unread')">Unread</button>
            <button class="read-btn read"  v-if="msg.status==0 && !is_answer" @click="set_status('read')"><svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#tick_icon"></use></svg>Read</button>
            <p class="msg-date">{{msg.created_at|datetime}}</p>
        </div>
    </li>
</template>