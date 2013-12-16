var wotd;
var correct;
var incorrect;
var current;
var mw_url = 'http://www.merriam-webster.com/word-of-the-day';
var audio_url = 'http://media.merriam-webster.com/soundc11';


function random_word() {
    return wotd[Math.floor(Math.random() * wotd.length)];
}


function get_sense(word) {
    var sense = '';

    for (var j = 0; j < word.sense.length; j++) {
        if (j) sense += '<br/>';
        sense += word.sense[j];
    }

    return sense;
}


function play_audio(url) {
    $('#audio').html($('<audio>').attr({autoplay: true, src: url}));
}


function play_word_audio(word) {
    if (word.audio) {
        var url = audio_url + '/' + word.audio.substr(0, 1) + '/' + word.audio;
        play_audio(url);
    }
}


function update_word(word) {
    $('#word')
        .text(word.word + ' - ' + word.pron + ' - ' + word.func + ' ')
        .off()
        .click(function () {play_word_audio(word);});

    var url = mw_url + '/' + word.date.substr(0, 4) + '/' +
        word.date.substr(5, 2) + '/' + word.date.substr(8, 2) + '/';
    $('#date')
        .html($('<a>').attr({href: url, target: '_blank'}).text(word.date))

    $('#sense').html('<h3>Definitions</h3>' + get_sense(word));
    $('#examples').html('<h3>Examples</h3>' + word.examples);
    $('#etymology').html('<h3>Did you know?</h3>' + word.etymology);
    $('#content a').attr('target', '_blank');
}


function show_word() {
    $('#choices').hide();
    $('#details').show();

    $('#button')
        .text('Continue')
        .off()
        .click(choose_word);
}


function choice_correct() {
    correct++;
    $.cookie('wotd_correct', correct);
    update_score();
    play_audio('success.wav');

    setTimeout(choose_word, 1250);
}


function choice_incorrect(correct, choice) {
    incorrect++;
    $.cookie('wotd_incorrect', incorrect);
    update_score();
    play_audio('fail.wav');

    var choices = $('#choices li');

    if (typeof choice != 'undefined')
        $(choices[choice]).css('background', '#faa');
    $(choices[correct]).css('background', '#afa');

    setTimeout(show_word, 3000);
}


function update_score() {
    var total = correct + incorrect;
    var percent = total ? correct / total * 100 : 100;
    $('#score')
        .html('Score: ' + correct + '/' + total + ' ' + percent.toFixed(2) +
              '% ')
        .append($('<a href="#">').text('Reset').click(reset_score));
}


function reset_score(e) {
    correct = incorrect = 0;
    $.removeCookie('wotd_incorrect');
    $.removeCookie('wotd_correct');
    update_score();
    e.preventDefault();
}


function choose_word() {
    update_score();

    current = random_word();
    update_word(current);
    $('#choices').show();
    $('#details').hide();
    play_word_audio(current);

    var pos = Math.floor(Math.random() * 5);

    words = [];
    while (words.length < 5) {
        if (words.length == pos) {
            words.push(current);
            continue;
        }

        option = random_word();
        if (option.word == current.word || option.func != current.func)
            continue;

        var ok = true;
        for (var i = 0; i < words.length; i++)
            if (words[i].word == option.word) ok = false;

        if (ok) words.push(option);
    }

    var senseOrExamples = Math.random() < 0.5;
    var choices = $('#choices').html('');
    for (var i = 0; i < words.length; i++) {
        var re = new RegExp(words[i].word, 'gi');

        var content;
        if (senseOrExamples) content = get_sense(words[i]);
        else content = words[i].examples;

        content = content.replace(re, '<b>' + current.word + '</b>');

        $('<li>')
            .html(content)
            .click(i == pos ? choice_correct : function (i) {
                return function () {choice_incorrect(pos, i);}
            }(i))
            .appendTo(choices);
    }

    $('#button')
        .text('Skip')
        .off()
        .click(function () {choice_incorrect(pos);});
}


function process_wotd(data) {
    wotd = data;
    choose_word();
}


function cookie_number(name) {
    var value = $.cookie(name);
    if (typeof value == 'undefined') return 0;
    return parseInt(value);
}


$(function () {
    correct = cookie_number('wotd_correct');
    incorrect = cookie_number('wotd_incorrect');

    $.getJSON('wotd.json', null, process_wotd);
});
