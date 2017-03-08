// 3/6/17: Outstanding issues to fix:
// create pseudorandom order of trials within subblocks, then randomize order of subblocks
// optional: enter normative IAPS ratings so data is easier to deal with
// finished function is timing out too quickly
// stop it from counting position in the instructions3 (begin) slide


// ################################ Overview #####################################

// I'm implementing the experiment using a data structure that I call a **sequence**. The insight behind sequences is that many experiments consist of a sequence of largely homogeneous trials that vary based on a parameter. For instance, in this example experiment, a lot stays the same from trial to trial - we always have to present some number, the subject always has to make a response, and we always want to record that response. Of course, the trials do differ - we're displaying a different number every time. The idea behind the sequence is to separate what stays the same from what differs - to **separate code from data**. This results in **parametric code**, which is much easier to maintain - it's simple to add, remove, or change conditions, do randomization, and do testing.

// ## High-level overview
// Things happen in this order:
// 
// 1. Compute randomization parameters (block order and trial order) and show the instructions slide.
// 2. Set up the experiment sequence object.
// 3. When the subject clicks the start button, it calls <code>experiment.next()</code>
// 4. <code>experiment.next()</code> checks if there are any trials left to do. If there aren't, it calls <code>experiment.end()</code>, which shows the finish slide, waits for 1.5 seconds, and then uses mmturkey to submit to Turk.
// 5. If there are more trials left, <code>experiment.next()</code> shows the next trial, records the current time for computing reaction time, and sets up a listener for a key press.
// 6. The key press listener, when it detects a key response, constructs a data object, which includes the presented IAPS stimulus number, RT (current time - start time), and rating response. This entire object gets pushed into the <code>experiment.data</code> array. Then we show a blank screen and wait 500 milliseconds before calling <code>experiment.next()</code> again.


// To do practice: copy rest of experiment
// append practice photos onto IAPS length - append, say if 3* (or however many) then done

// ############################## Helper functions ##############################


// Shows slides. We're using jQuery here - the **$** is the jQuery selector function, which takes as input either a DOM element or a CSS selector string.
function showSlide(id) {
  // Hide all slides
  $(".slide").hide();
  // Show just the slide we want to show
  $("#"+id).show();
}

// Get random integers. This is useful for randomizing Rating order.
// When called with no arguments, it returns either 0 or 1. When called with one argument, *a*, it returns a number in {*0, 1, ..., a-1*}. When called with two arguments, *a* and *b*, returns a random value in {*a*, *a + 1*, ... , *b*}.
function random(a,b) {
  if (typeof b == "undefined") {
    a = a || 2;
    return Math.floor(Math.random()*a);
  } else {
    return Math.floor(Math.random()*(b-a+1)) + a;
  }
}

// Add a random selection function to all arrays (e.g., <code>[4,8,7].random()</code> could return 4, 8, or 7). This is useful for condition randomization.
Array.prototype.random = function() {
  return this[random(this.length)];
}

// shuffle function - from stackoverflow?
// shuffle ordering of argument array
function shuffle (a)
{
    var o = [];

    for (var i=0; i < a.length; i++) {
      o[i] = a[i];
    }

    for (var j, x, i = o.length;
         i;
         j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

// from: http://www.sitepoint.com/url-parameters-jquery/
$.urlParam = function(name){
  var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
  if (results==null){
    return null;
  } else{
    return results[1] || 0;
  }
}

//Check if using a mobile device
  //from: http://stackoverflow.com/questions/3514784/what-is-the-best-way-to-detect-a-mobile-device-in-jquery
var checkmobile = false;
var mobilecheck = function() {
  (function(a){
    if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) checkmobile = true;})
    (navigator.userAgent||navigator.vendor||window.opera);
   return checkmobile;
};

// Set scale to show
var showRating = function() {
  countPosition();
    if (part_of_trial == 0) { // If back at beginning of trial, go to next image
    experiment.next()
  }

  if (scale_type[subblock] == "bipolar" && scale_order == "AB" && part_of_trial == 1) {
    $('#bipolarvalence-content').show()
    $('#arousal-content').hide()
    $('#pleasant-content').hide()
    $('#unpleasant-content').hide()
    $("#nomobile-content-content").hide();
    scale_content = "bipolarvalence";
  }
  if (scale_type[subblock] == "bipolar" && scale_order == "AB" && part_of_trial == 2) {
    $('#arousal-content').show()
    $('#bipolarvalence-content').hide()
    $('#pleasant-content').hide()
    $('#unpleasant-content').hide()
    $("#nomobile-content-content").hide();
    scale_content = "arousal";
  }
  if (scale_type[subblock] == "bipolar" && scale_order == "BA" && part_of_trial == 1) {
    $('#arousal-content').show()
    $('#bipolarvalence-content').hide()
    $('#pleasant-content').hide()
    $('#unpleasant-content').hide()
    $("#nomobile-content-content").hide();
    scale_content = "arousal";
  }
  if (scale_type[subblock] == "bipolar" && scale_order == "BA" && part_of_trial == 2) {
    $('#bipolarvalence-content').show()
    $('#arousal-content').hide()
    $('#pleasant-content').hide()
    $('#unpleasant-content').hide()
    $("#nomobile-content-content").hide();
    scale_content = "bipolarvalence";
  }
  if (scale_type[subblock] == "unipolar" && scale_order == "AB" && part_of_trial == 1) {
    $('#pleasant-content').show()
    $('#bipolarvalence-content').hide()
    $('#arousal-content').hide()
    $('#unpleasant-content').hide()
    $("#nomobile-content-content").hide();
    scale_content = "pleasant";
  }
  if (scale_type[subblock] == "unipolar" && scale_order == "AB" && part_of_trial == 2) {
    $('#unpleasant-content').show()
    $('#bipolarvalence-content').hide()
    $('#arousal-content').hide()
    $('#pleasant-content').hide()
    $("#nomobile-content-content").hide();
    scale_content = "unpleasant";
  }
  if (scale_type[subblock] == "unipolar" && scale_order == "BA" && part_of_trial == 1) {
    $('#unpleasant-content').show()
    $('#bipolarvalence-content').hide()
    $('#arousal-content').hide()
    $('#pleasant-content').hide()
    $("#nomobile-content-content").hide();
    scale_content = "unpleasant";
  } 
  if (scale_type[subblock] == "unipolar" && scale_order == "BA" && part_of_trial == 2) {
    $('#pleasant-content').show()
    $('#bipolarvalence-content').hide()
    $('#arousal-content').hide()
    $('#unpleasant-content').hide()
    $("#nomobile-content-content").hide();
    scale_content = "pleasant";
  } 
}

var subtractPosition = function() {
  part_of_trial = -1;
}

var countPosition = function() {
  // Count part_of_trial: 0 = picture, 1 = 1st rating scale, 2 = 2nd rating scale
  if (part_of_trial == 2) {  // if 2nd rating has been completed, start at top of next trial
    part_of_trial = 0
  } else {
    part_of_trial = part_of_trial+1
  }

  // Count trial number
  if (part_of_trial == 2) {
    trial = trial+1;  // first 4 trials are practice 
  }

  // Count subblocks and blocks from start of experiment (i.e. trials - 4)
  if (is_practice == false) { 

    // Count subblock number (1:4) within subblock
    // skipping ahead of first 4 practice trials, if 6th trial in subblock, subblock ends
    if (trial !== 1 && (trial-4)%6 == 1) { 
      var new_subblock = true;
      subblock = subblock+1;
    } 
    if ((trial-4)%6 !== 0) {
      var new_subblock = false;
    }

    // Count block number (1:3) within experiment
    if (subblock == 4 && new_subblock == true) {
      new_block == true
      block = block+1;
    } 
    else {
      new_block = false
    }
  }
}

// ############################## Configuration settings ##############################

// Set IAPS stimuli
var iaps = [
// 1052,1200,1303,1450,1460, //5
// 1540,1645,1661,1710,1931, //10
// 2091,2190,2205,2210,2300, //15
// 2304,2347,2352.2,2358,2530, //20
// 2580,2590,2595,2682,2688, //25
// 2770,2900.1,3000,3053,3063, //30
// 3180,3185,4225,4274,4490, //35
// 4574,4624,4643,4649,4664.1, //40
// 4750,4810,5000,5534,5760, //45
// 5830,5973,6263,6550,6562, //50
// 7046,7078,7175,7234,7440, //55
// 7476,7545,8065,8160,8185, //60
// 8190,8200,8311,8312,8400, //65
 8475,8540,9000,9332,9412, //70
9471,9594 //72
];

var totalTrials = iaps.length;

function getiapsFile(image_num) {
  return 'http://web.stanford.edu/~mtb/IAPS_stimuli/' + image_num + '.jpg'; //images stored on my website
}

// Initialize rating scale order for entire experiment (50% chance)
var order = Math.random()
if (order >= 0.5) {
  var scale_order = 'AB';
} else {
  var scale_order = 'BA';
}

// Initialize presentation order (randomly out of 8 possible counterbalanced orders)
var present_order = Math.floor(Math.random() * (8)) + 1;
if (present_order == 1) {
  var scale_type = [
    'bipolar',
    'unipolar',
    'bipolar',
    'unipolar',
    'bipolar',
    'unipolar',
    'bipolar',
    'unipolar',
    'bipolar',
    'unipolar',
    'bipolar',
    'unipolar'];
  var subblock_order = [1,2,3,4];
  var iaps_order = shuffle(iaps);
} 
if (present_order == 2) {
  var scale_type = [
    'bipolar',
    'unipolar',
    'bipolar',
    'unipolar',
    'bipolar',
    'unipolar',
    'bipolar',
    'unipolar',
    'unipolar',
    'bipolar',
    'unipolar',
    'bipolar'];
  var subblock_order = [3,1,4,2];
  var iaps_order = shuffle(iaps);
} 
if (present_order == 3) {
  var scale_type = [
    'bipolar',
    'unipolar',
    'bipolar',
    'unipolar',
    'unipolar',
    'bipolar',
    'unipolar',
    'bipolar',
    'bipolar',
    'unipolar',
    'bipolar',
    'unipolar'];
  var subblock_order = [2,4,1,3];
  var iaps_order = shuffle(iaps);
}
if (present_order == 4) {
  var scale_type = [
    'unipolar',
    'bipolar',
    'unipolar',
    'bipolar',
    'bipolar',
    'unipolar',
    'bipolar',
    'unipolar',
    'bipolar',
    'unipolar',
    'bipolar',
    'unipolar'];
  var subblock_order = [4,3,2,1];
  var iaps_order = shuffle(iaps);
} 
if (present_order == 5) {
  var scale_type = [
    'bipolar',
    'unipolar',
    'bipolar',
    'unipolar',
    'unipolar',
    'bipolar',
    'unipolar',
    'bipolar',
    'unipolar',
    'bipolar',
    'unipolar',
    'bipolar'];
  var subblock_order = [4,3,2,1];
  var iaps_order = shuffle(iaps);
} 
if (present_order == 6) {
  var scale_type = [
    'unipolar',
    'bipolar',
    'unipolar',
    'bipolar',
    'bipolar',
    'unipolar',
    'bipolar',
    'unipolar',
    'unipolar',
    'bipolar',
    'unipolar',
    'bipolar'];
  var subblock_order = [2,4,1,3];
  var iaps_order = shuffle(iaps);
} 
if (present_order == 7) {
  var scale_type = [
    'unipolar',
    'bipolar',
    'unipolar',
    'bipolar',
    'unipolar',
    'bipolar',
    'unipolar',
    'bipolar',
    'bipolar',
    'unipolar',
    'bipolar',
    'unipolar'];
  var subblock_order = [3,1,4,2];
  var iaps_order = shuffle(iaps);
} 
if (present_order == 8) {
  var scale_type = [
    'unipolar',
    'bipolar',
    'unipolar',
    'bipolar',
    'unipolar',
    'bipolar',
    'unipolar',
    'bipolar',
    'unipolar',
    'bipolar',
    'unipolar',
    'bipolar'];
  var subblock_order = [1,2,3,4];
  var iaps_order = shuffle(iaps);
} 

// Set counts for trial, subblock, block, and part_of_trial
var trial = 1;
var subblock = 1;
var block = 1;
var part_of_trial = 0; // make sure this updates!
var new_subblock = [];
var new_block = [];
var iaps_trial;
var scale_content;

var date = new Date();
// ############################## Instructions ##################################

// Show the instructions slide -- this is what we want subjects to see first.
showSlide("instructions");

// ############################### Practice Trials #############################

var is_practice = false;

var practice_iaps = [
// 5010,
// 4005,
// 1820,
2320
];

var totalpracticeTrials = practice_iaps.length;

var practice = function() {

  is_practice = true;

  var scale_type = [
    'bipolar',
    'bipolar',
    'unipolar',
    'unipolar'];

  experiment.next();
}

// ############################## The main event ##############################

var experiment = {

    // The object to be submitted.
    data: {
      //trial info
      iaps_order: [],
      scale_order: [],
      scale_type: [],
      scale_content: [],
      //where we are in trials
      is_practice: [],
      part_of_trial: [],
      trial: [],
      subblock: [],
      block: [],
      new_subblock: [],
      new_block: [],
      //trial data
      iaps_trial: [],
      rating: [],
      elapsed_ms: [],
      //browser checks
      window_width: [],
      window_height: [],
      checkmobile: [],
      //user and demographics
      user_agent: [],
      date: [],
      age: [],
      gender: [],
      education: [],
      chronotype: []
    },

    start_ms: 0,  // time current trial started ms
    num_errors: 0,    // number of errors so far in current trial
    trials_left: totalTrials,

    // end the experiment
    end: function() {
      showSlide("finished");
      setTimeout(function() {
        turk.submit(experiment.data)
      }, 1500);
    },

    // LOG RESPONSE
    log_response: function() {
      var response_logged = false;
      var elapsed = Date.now() - experiment.start_ms;

      //Array of radio buttons
      var radio = document.getElementsByName("judgment");

      // Loop through radio buttons
      for (i = 0; i < radio.length; i++) {
        if (radio[i].checked) {
          // Push where we are in trials
          experiment.data.is_practice.push(is_practice);          
          experiment.data.block.push(block);
          experiment.data.new_block.push(new_block)
          experiment.data.subblock.push(subblock);
          experiment.data.new_subblock.push(new_subblock)
          experiment.data.trial.push(trial);
          experiment.data.part_of_trial.push(part_of_trial);

          // Push the trial info
          experiment.data.scale_type.push(scale_type[subblock]);
          experiment.data.scale_order.push(scale_order);
          experiment.data.iaps_trial.push(iaps_trial);

          // Push trial data
          experiment.data.rating.push(radio[i].value);
          experiment.data.elapsed_ms.push(elapsed);
          experiment.data.scale_content.push(scale_content);

          // Make response_logged
          response_logged = true;
        }
      }

      if (response_logged) {
        //nextButton.blur();

        // uncheck radio buttons
        for (i = 0; i < radio.length; i++) {
          radio[i].checked = false
        }

        $(".testMessage").html('');   // clear the test message
        showRating();
      } else {
          experiment.num_errors += 1;
          $(".testMessage").html('<font color="red">' +
               'Please make a response!' +
               '</font>');
      }
    },

    // The work horse of the sequence - what to do on every trial.
    next: function() {      
      // Allow experiment to start if it's a turk worker OR if it's a test run
      if (window.self == window.top | turk.workerId.length > 0) {
          $("#prog").attr("style","width:" +
              String(100 * (1 - iaps_order.length/totalTrials)) + "%")
          // style="width:progressTotal%"

          // practice trials
          if (is_practice == true) {

            // Get the current trial - <code>shift()</code> removes the first element
            // select from our scales array and stop exp after we've exhausted all the domains
            iaps_trial = practice_iaps.shift();

            // Display the picture stimuli
            var iaps_filename = getiapsFile(iaps_trial);
            $("#iaps").attr('src', iaps_filename);

            // push all relevant variables into data object
            experiment.data.window_width.push($(window).width());
            experiment.data.window_height.push($(window).height());

            //display slides:
            showSlide("stage");
            $("#bipolarvalence-content").hide();
            $("#arousal-content").hide();
            $("#pleasant-content").hide();
            $("#unpleasant-content").hide();
            $("#stage-content").hide();

            // 3 s ISI - no between-block ISI
            window.setTimeout(function() {
              $("#blank-content").show();
            });

            window.setTimeout(function() {
              $("#stage-content").show();
              experiment.start_ms = Date.now();
            }, 3000);

            window.setTimeout(function() {
              $("#stage-content").hide();
            }, 9000);

            window.setTimeout(function() {
              showRating()
            }, 9000);

            // end of practice trials
            if (typeof iaps_trial == "undefined") {
              showSlide("instructions3") 
              is_practice = false 
            }

          } 
          // experimental trials
          else { 

            // Get the current trial - <code>shift()</code> removes the first element
            // select from our scales array and stop exp after we've exhausted all the domains
            iaps_trial = iaps_order.shift();

            //If the current trial is undefined, call the end function.
            if (typeof iaps_trial == "undefined") {
              return experiment.debriefing();
            }

            // Display the picture stimuli
            var iaps_filename = getiapsFile(iaps_trial);
            $("#iaps").attr('src', iaps_filename);

            // push all relevant variables into data object
            experiment.data.part_of_trial.push(part_of_trial);
            experiment.data.window_width.push($(window).width());
            experiment.data.window_height.push($(window).height());

            //display slides:
            showSlide("stage");
            $("#bipolarvalence-content").hide();
            $("#arousal-content").hide();
            $("#pleasant-content").hide();
            $("#unpleasant-content").hide();
            $("#stage-content").hide();

            // 3 s ISI - no between-block ISI
            window.setTimeout(function() {
              $("#blank-content").show();
            });

            window.setTimeout(function() {
              $("#stage-content").show();
              experiment.start_ms = Date.now();
            }, 3000);

            window.setTimeout(function() {
              $("#stage-content").hide();
            }, 9000);

            window.setTimeout(function() {
              showRating()
            }, 9000);
          }  
      }
    },

    //  go to debriefing slide
    debriefing: function() {
      showSlide("debriefing");
      setTimeout(function() {
      $("#debriefing").show();
      }, 8000);
    },

    // submitcomments function
    submit_comments: function() {
      var races = document.getElementsByName("race[]");
      for (i = 0; i < races.length; i++) {
        if (races[i].checked) {
          experiment.data.race.push(races[i].value);
        }
      }

      // Save subblock order and iaps order
      experiment.data.subblock_order.push(subblock_order);
      experiment.data.iaps_order.push(iaps_order);
      // Save mobile check
      experiment.data.checkmobile.push(checkmobile);
      // Save ending questions
      experiment.data.age.push(document.getElementById("age").value);
      experiment.data.gender.push(document.getElementById("gender").value);
      experiment.data.education.push(document.getElementById("education").value);
      experiment.data.chronotype.push(document.getElementById("chronotype").value);
      experiment.data.expt_aim.push(document.getElementById("expthoughts").value);
      experiment.data.expt_gen.push(document.getElementById("expcomments").value);
      experiment.data.type.push(type);
      experiment.data.user_agent.push(window.navigator.userAgent);
      // Save date
      experiment.data.date.push(date);

      // End experiment
      experiment.end();
    }
}

$(function() {
  $('form#demographics').validate({
    rules: {
      "age": "required",
      "gender": "required",
      "education": "required",
      "race[]": "required",
    },
    messages: {
      "age": "Please choose an option",
      "gender": "Please choose an option",
      "education": "Please choose an option",
    },
    submitHandler: experiment.submit_comments
  });
  $('#race_group input[value=no_answer]').click(function() {
    $('#race_group input').not('input[value=no_answer]').attr('checked', false);
  });
  $('#race_group input').not('input[value=no_answer]').click(function() {
    $('#race_group input[value=no_answer]').attr('checked', false);
  });
});

