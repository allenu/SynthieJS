
var g_sampleRate = 11025
var g_playing = false
var g_audioNode = null
var g_gainNode = null
var g_fullGain = 0.5
var g_audioContext

function DidPressStart() {
    var startButton = document.getElementById("StartButton")

    if (g_playing) {
        g_playing = false
        g_gainNode.gain.value = 0.0
        startButton.text = "Start"
        TearDownAudio()
    } else {
        g_playing = true
        startButton.text = "Stop"
        SetupAudio()
    }
}

function SetupAudio() {
    console.log("Setting up audio...")

    var bufferSize = 4096
    var audioContext
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext
        audioContext = new AudioContext()
        audioContext.sampleRate = g_sampleRate
        g_audioContext = audioContext
    } catch(e) {
      alert('Web Audio API is not supported in this browser');
    }
        
    // Create a pcm processing "node" for the filter graph.
    // https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createScriptProcessor
    g_audioNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
    g_audioNode.onaudioprocess = function(e) {
        var output = e.outputBuffer.getChannelData(0)
        for (var i = 0; i < bufferSize; i++) {
            let sample = Math.random() * 2 - 1
            output[i] = sample
        }
    }

    // TODO: We use gain to disable audio output at first. It would be more prudent
    // to just stop() the output entirely if we can.
    g_gainNode = audioContext.createGain()
    g_gainNode.gain.value = g_fullGain
    g_gainNode.connect(audioContext.destination)

    g_audioNode.connect(g_gainNode)
}

function TearDownAudio() {
    g_audioContext.close()
    g_audioContext = null
}

