import { world } from "@minecraft/server"
import {ABF,UI,Scripts} from "abf.js";
world.afterEvents.chatSend.subscribe(({ message, sender: player }) => {
    if (message != 'form') return;
    const form = new ABF()
        .title('   What option do you think is correct?    \n')
        .pattern([
            ['#          ', '%1', "#                    ", "%0 def_def 100"],// number input syntax: "%<default value> <min_max> <increament>"  min_max values and increaments are optional, you can set global values in settings
            ['#      ', 'Option 3', '#      ', 'Option 4', '#\n'],
            ['#      ', '#Do you think this form is cool?', '#      '],
            ['#         ', 'Yes', '#            ', 'No', '#']
        ])
        .scripts(Scripts.basic)
    form.ui = UI.darkMode
    form.settings.type.slow();

    form.offset(30,30) //you can enable devmode in .show() to find the optimal offset for you
    form.show(player, 0, 1).then(({ line, slot, cancelled, values }) => {
        if (cancelled) return;

        player.sendMessage(JSON.stringify(values))
    })
});
