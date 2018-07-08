
var g_sampleRate = 44100
var g_playing = false
var g_audioNode = null
var g_gainNode = null
var g_fullGain = 0.8
var g_audioContext
var g_synthesizer = null
var g_time = 0.0
var g_bufferSize = 4096
var g_bufferTime = 1.0 * g_bufferSize / g_sampleRate

function DidPressStart() {
    var startButton = document.getElementById("StartButton")

    if (g_playing) {
        g_playing = false
        g_gainNode.gain.value = 0.0
        startButton.text = "Play"
        TearDownAudio()
    } else {
        g_playing = true
        startButton.text = "Stop"
        SetupAudio()
    }
}

function SetupAudio() {
    console.log("Setting up audio...")

    g_time = 0.0
    g_synthesizer = f_create_synthesizer()

    var audioContext
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext
        audioContext = new AudioContext()
        // TODO: this doesn't seem to have an effect. It's always 44.1kHz.
        // audioContext.sampleRate = g_sampleRate
        g_audioContext = audioContext
    } catch(e) {
      alert('Web Audio API is not supported in this browser');
    }
        
    // Create a pcm processing "node" for the filter graph.
    // https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createScriptProcessor
    g_audioNode = audioContext.createScriptProcessor(g_bufferSize, 1, 1);
    g_audioNode.onaudioprocess = function(e) {
        var output = e.outputBuffer.getChannelData(0)
        for (var i = 0; i < g_bufferSize; i++) {
            let time = g_time + i * 1.0 / g_sampleRate
            let sample = f_synthesizer_sample(g_synthesizer, time)
            output[i] = sample
        }
        g_time = g_time + g_bufferTime
    }

    g_gainNode = audioContext.createGain()
    g_gainNode.gain.value = g_fullGain
    g_gainNode.connect(audioContext.destination)

    g_audioNode.connect(g_gainNode)
}

function TearDownAudio() {
    g_audioContext.close()
    g_audioContext = null
}

