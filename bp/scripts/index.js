import { world } from "@minecraft/server"
import {ABF,UI,Scripts,Line} from "abf.js";
world.afterEvents.chatSend.subscribe(({ message, sender: player }) => {
    if (message != 'form') return;
    const line = new Line();
    line.add('test', true).add('test').add('test',true)
    line.remove(2)
    const form = new ABF()
        .title('   What option do you think is correct?    \n')
        .pattern([
            ['#      ', 'Option 1', '#      ', 'Option 2'],
            ['#      ', 'Option 3', '#      ', 'Option 4', '#\n'],
            ['#      ', '#Do you think this form is cool?', '#      '],
            ['#         ', 'Yes', '#            ', 'No', '#']

        ])
        .scripts(Scripts.basic)
    form.ui = UI.darkMode
    form.settings.type.default();

    form.offset(30,30)
    form.show(player, 0, 1).then(({ line, slot, cancelled }) => {
        if (cancelled) return;

    })
});
