<script>
import Message from './order_message.vue';

export default {
    props:['order_id'],
    data(){return {
        messages:[],
        choose_sender_modal:false,
        new_message:'',
    }},
    created(){
        this.fetch_messages();
    },
    components:{
        'message-li':Message
    },
    methods:{
        pre_send(){
            this.choose_sender_modal = true;
        },
        send(role){
            this.choose_sender_modal = false;

            var msg = {
                message:this.new_message,
                sender_role:'writer',
                created_at:new Date(),
                order_id:this.order_id,
                recepient_role:role,
            }
            this.messages.push(msg);
            this.$root.request({
                url:"/messages/",
                method:'post',
                data:msg
            });
            this.new_message = '';
        },
        send_cancel(){
            this.choose_sender_modal = false;
        },
        fetch_messages(){
            var self = this;
            this.$root.request({
                url:"/orders/messages/"+this.order_id+"?_json=1",
                success:function(data){
                    if(data.messages){
                        self.messages = data.messages;
                    }
                }
            });
        },
    }
}
</script>




<template>
    <div class="frame-inner">
        <div class="empty-state no-messages" v-if="!messages.length">
            <div class="svg-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#empty_no_messages_icon"></use></svg>
            </div>
            <p class="empty-state-title">No messages yet</p>
            <p class="empty-state-subtitle">Feel free to start the chat!</p>
        </div>

        <ul class="messages-list">
            <message-li v-for="msg in messages" :msg="msg" :key="msg._id"></message-li>
        </ul>

        <div class="modal2" v-if="choose_sender_modal">
            <ul class="modal2-send-block">
                <li><a href="#" @click.prevent="send('operator')">Send to Operator</a></li>
                <li><a href="#" @click.prevent="send('client')">Send to Client</a></li>
                <li><a href="#" @click.prevent="send('pregrader')">Send to Grader</a></li>
                <li class="cancel" @click.prevent="send_cancel"><a href="#">Cancel</a></li>
            </ul>
            <!-- <div class="modal2-bottom-msg">Will be done really soon.</div> -->
        </div>

        <div class="bottom-input">
            <input type="text" placeholder="Type your message" @input="new_message = $event.target.value" :value="new_message">
            <button class="bottom-send-bnt" @click="pre_send" :disabled.trim="!new_message">Send</button>
        </div>
    </div>
</template>