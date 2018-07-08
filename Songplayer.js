var kSynthesizerAction_PlayTone = 0
var kSynthesizerAction_ReleaseTone = 1
var kPatternAction_PlayTone = 0
var kPatternAction_ReleaseTone = 1

var s_AllNotes = [16.35, 17.32, 18.35, 19.45,
    20.60,21.83,23.12,24.50,
    25.96,27.50,29.14,30.87]

function FreqForNoteOctave(note, octave) {
    return s_AllNotes[note] * Math.pow(2, octave)
}

// Convert a set of pattern commands into synthesizer commands. The synthesizer doesn't
// know anything about tick indexes, tick periods or what the instruments are, so this
// translates those concepts into ones that the synthesizer understands.
//
// - num_pattern_commands, pattern_commands: the number of and the pattern commands themselves
// - pattern_start_time: when this pattern began (time of tick 0)
// - tick_period: how long each tick is
// - num_instruments, instruments: the number of and the actual instruments themselves
//
// Caller must delete [] the returned array.
function f_synthesizer_commands_from_pattern_commands(
        pattern_commands,
        pattern_start_time,
        tick_period,
        instruments) {
    
    let synthesizer_commands = []
    
    for (var i=0; i < pattern_commands.length; i++) {
        let pattern_command = pattern_commands[i]

        let action_type = null
        switch (pattern_command.action_type) {
        case kPatternAction_PlayTone:
            action_type = kSynthesizerAction_PlayTone
            break

        case kPatternAction_ReleaseTone:
            action_type = kSynthesizerAction_ReleaseTone
            break

        default:
            console.log("Bad action type " + pattern_command.action_type)
        }

        let instrument = null
        let freq = 0
        if (action_type == kPatternAction_PlayTone) {
            instrument = instruments[pattern_command.instrument_index]
            freq = FreqForNoteOctave(pattern_command.note, pattern_command.octave)
        }
        let synthesizer_command = {
            channel: pattern_command.channel,
            time: pattern_start_time + pattern_command.tick_index * tick_period,
            action_type: action_type,
            freq: freq,
            instrument: instrument
        }

        synthesizer_commands.push(synthesizer_command)
    }
    
    return synthesizer_commands
}

// Given a song player state, return the next song player state, given the song being played and the current time.
function f_next_song_player_state(prev_state, song) {
    let next_song_reader_state = f_next_song_reader_state(prev_state.song_reader_state, song)

    let current_pattern = song.patterns[next_song_reader_state.pattern_index]
    let tick_period = 60.0 / (current_pattern.bpm * current_pattern.ticks_per_beat)

    let next_synthesizer_state = null

    if (next_song_reader_state.pattern_commands.length > 0) {
        // We have pattern commands that we must apply to the synthesizer

        // First convert them to synthesizer commands
        let synthesizer_commands = f_synthesizer_commands_from_pattern_commands(
            next_song_reader_state.pattern_commands,
            next_song_reader_state.pattern_start_time,
            tick_period,
            song.instruments)

        // Apply them to the synthesizer to get a new state
        next_synthesizer_state = f_next_synthesizer_state(prev_state.synthesizer_state,
            synthesizer_commands)
    } else {
        next_synthesizer_state = {...prev_state.synthesizer_state}
    }

    let next_state = {
        next_tick_time: prev_state.next_tick_time + tick_period,
        song_reader_state: next_song_reader_state,
        synthesizer_state: next_synthesizer_state
    }

    return next_state
}

// Create a new song player from scratch.
function create_song_player_state(num_channels) {
    let song_player_state = {
        song_reader_state: {
            song_reader_options: {
                repeats: true,
                delay_between_repetition: 0.0
            },
            started_playing: false,
            done: false,
            pattern_start_time: 0.0,
            pattern_index: 0,
            tick_index: 0,
            next_pattern_command_index: 0,
            pattern_commands: []
        },
        synthesizer_state: f_create_empty_synthesizer(),
        next_sample_time: 0.0,
        next_tick_time: 0.0
    }

    return song_player_state
}
