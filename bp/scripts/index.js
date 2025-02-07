import { world } from "@minecraft/server"
import {ABF,UI,Scripts} from "abf.js";
world.afterEvents.chatSend.subscribe(({ message, sender: player }) => {
    if (message != 'form') return;
    // number input syntax: "%<default value> <min_max> <increament>"  min_max values and increaments are optional, you can set global values in settings
    // toggle syntax: "$<default value (true/false)>"
    // checkbox syntax: "@<text>"
    const form = new ABF()
        .title('   What option do you think is correct?    \n')
        .pattern([
            ['#      ', 'option 1', "#      ", "option 2"],
            ['#      ', '@checkbox 1', "#      ", "@checkbox 2"],
            ['#      ', 'Option 3', '#      ', 'Option 4'],
            ["#      ", "#Number example: ", "%0"],
            ["#      ", "#Toggle 1: ", "$false"],
            ["#      ", "#Toggle 2: ", "$true"]
        ])
        .scripts(Scripts.basic)
    form.ui = UI.darkMode
    form.settings.type.default();

    form.offset(30,30) //you can enable devmode in .show() to find the optimal offset for you
    form.show(player, 0, 0).then(({ line, slot, cancelled, values }) => {
        if (cancelled) return;

        if (values) player.sendMessage(JSON.stringify(values))
    })
});
