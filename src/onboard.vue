<script>
export default {
    mounted(){
        //root
        var $ = window.$;
        var mc = new Hammer(this.$el);

        //mouse pointer state
        var pointerXCoord = 0;
        //image lefting
        var imageLeftCord = 0;
        //carousel width
        var carouselWidth = $('.carousel-inner').width();
        //lastmove
        var lastMove = '';


        $('#carousel-onboarding').carousel({
            interval: false,
            wrap: false
        });

        function initialize(){
            $('#carousel-onboarding').carousel('cycle');
            carouselWidth  = $('.carousel-inner').width();
            imageLeftCord = 0;
            pointerXCoord = 0;
            lastMove = '';
        }

        function snapLeft(){
            $('.item').css({transition:'',transform:''});
            $('.item').removeClass('prev');
            $('.item').removeClass('next');
            $('#carousel-onboarding').carousel('prev');
            setTimeout(function(){
                initialize();
            }, 600);
        }

        function snapRight(){
            $('.item').css({transition:'',transform:''});
            $('.item').removeClass('prev');
            $('.item').removeClass('next');
            $('#carousel-onboarding').carousel('next');
            setTimeout(function(){
                initialize();
            }, 600);
        }


        $('.carousel-control.left').click(function(){
            snapLeft();
        });

        $('.carousel-control.right').click(function(){
            snapRight();
        });

        mc.on('swipeleft', function(ev) {
            snapRight();
        });

        mc.on('swiperight', function(){
            snapLeft();
        })


        //CATCH PANNING EVENTS
        // mc.on('panstart panend panleft panright', function(ev) {
        mc.on('panstart panend panleft panright', function(ev) {

            //PAUSE THE CAROUSEL
            $('#carousel-onboarding').carousel('pause');

            //set next and prev with circular searching
            var prev = $('.item.active').prev();
            if(prev[0] === undefined){
                prev = $('.carousel-inner').children().last();
            }
            prev.addClass('prev');

            var next = $('.item.active').next();
            if(next[0] === undefined){
                next = $('.carousel-inner').children().first();
            }
            next.addClass('next');

            //if is panstart set position of cursor for calculationg different positions
            if(ev.type === 'panstart'){
                pointerXCoord  = ev.pointers[0].pageX;
                return 0;
            }

            //MOVING
            if((pointerXCoord!==ev.pointers[0].pageX)){

                //set last action [left-right]
                lastMove = ev.type;

                //how much do you move?
                var diff =  ev.pointers[0].pageX - pointerXCoord;
                $('.item.active').css({transition:'initial',transform: 'translate3d('+ ( imageLeftCord + diff) +'px, 0, 0)'});
                $('.item.next').css({transition:'initial',transform: 'translate3d('+ ( imageLeftCord + diff +  carouselWidth ) +'px, 0, 0)'});
                $('.item.prev').css({transition:'initial',transform: 'translate3d('+ ( imageLeftCord + diff -  carouselWidth) +'px, 0, 0)'});

                //set variables for next turn
                imageLeftCord += diff;
                pointerXCoord = ev.pointers[0].pageX;
            }

            //end
            if(ev.type === 'panend'){

                if(imageLeftCord > (carouselWidth/2)){
                    if(lastMove === 'panright'){
                        snapLeft();
                        return 0;
                    }
                }

                if(imageLeftCord < -(carouselWidth/2)){
                    if(lastMove === 'panleft'){
                        snapRight();
                        return 0;
                    }
                }

                //return to the start position
                $('.item').css({transition:'',transform:''});
                initialize();

            }

        });
    },//mounted

    methods:{
        start_using(){
            this.$root.start_using();
        }
    }
}
</script>




<template>
<div id="carousel-onboarding" class="carousel slide">
    <!-- Indicators -->
    <ol class="carousel-indicators">
        <li data-target="#carousel-onboarding" data-slide-to="0" class="active"></li>
        <li data-target="#carousel-onboarding" data-slide-to="1"></li>
        <li data-target="#carousel-onboarding" data-slide-to="2"></li>
        <li data-target="#carousel-onboarding" data-slide-to="3"></li>
    </ol>

    <!-- Wrapper for slides -->
    <div class="carousel-inner" role="listbox">
        <div class="item frame1 active">
            <div class="svg-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#onboarding_icon1"></use></svg>
            </div>
            <p class="carousel-frame-title">Plan your workload</p>
            <p class="carousel-frame-subtitle">Browse and select available orders away from your PC</p>
        </div>
        <div class="item frame2">
            <div class="svg-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#onboarding_icon2"></use></svg>
            </div>
            <p class="carousel-frame-title">Set your work status</p>
            <p class="carousel-frame-subtitle">Tell us about your availability to highlight your interest in new orders</p>
        </div>
        <div class="item frame3">
            <div class="svg-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#onboarding_icon3"></use></svg>
            </div>
            <p class="carousel-frame-title">Get orders faster</p>
            <p class="carousel-frame-subtitle">Review recommendations on-the-go and accept orders instantly</p>
        </div>
        <div class="item frame4">
            <div class="svg-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#onboarding_icon4"></use></svg>
            </div>
            <p class="carousel-frame-title">Get instant notifications</p>
            <p class="carousel-frame-subtitle">Be aware about important order<br>updates</p>
            <button class="btn3" type="button" @click="start_using">Start using app</button>
        </div>
    </div>
</div>
</template>