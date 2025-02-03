import { world } from "@minecraft/server"
import {ABF,UI,Scripts} from "abf.js";
world.afterEvents.chatSend.subscribe(({ message, sender: player }) => {
    if (message != 'form') return;
    const form = new ABF()
        .title('   What option do you think is correct?    \n')
        .pattern([
            ['#          ', '%1 0_10', "#                    ", "%0"],
            ['#      ', 'Option 3', '#      ', 'Option 4', '#\n'],
            ['#      ', '#Do you think this form is cool?', '#      '],
            ['#         ', 'Yes', '#            ', 'No', '#'],

        ])
        .scripts(Scripts.basic)
    form.ui = UI.darkMode
    form.settings.type.default();

    form.offset(30,30)
    form.show(player, 0, 1).then(({ line, slot, cancelled }) => {
        if (cancelled) return;

    })
});
