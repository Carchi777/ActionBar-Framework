
import { world, Player, system, InputButton, } from "@minecraft/server"


// some utils for the user experience

// scripts for behavior
export const Scripts = {
    basic: {
        y: (y, line, slot) => { return { line: line += y, slot } },
        x: (x, line, slot) => { return { line: line, slot: slot += x } }
    },
}

// ui layouts
export const UI = {
    darkMode: {
        colors: {
            text: 'i',
            selected: 'f',
            all: 'f',
            title: 'f'
        },
        background: '§o§0',
        render: {
            light: '§i'
        }

    },
    lightMode: {
        colors: {
            text: '0',
            selected: '0',
            all: '0',
            title: '0'
        },
        background: '§o§1',
        render: {
            light: '§j'
        }

    }
}


// Class
export class ABF {
    // initialization of the form
    constructor() {
        this.#run = 0
        this.#title = ''
        this.#form = {
            display: [[]],
            scripts: {
                y: null,
                x: null
            },
        }
        return this;
    }
    #form; #run; #title; #offsetX=0; #offsetY=0; #type = "default";
    // define ui appearance
    ui = {
        colors: {
            text: '0',
            selected: '0',
            all: '0',
            title: '0'
        },
        background: '', // default black
        render: {
            light: '§j' // the color of the selected button blinking
        }
    }

    settings = {
        cancellable: false,
        type: {
            slow: () => this.#type = "slow",
            default: () => this.#type = "default"
        }
    }

    title(title = '') {
        this.#title = title
        return this
    }

    pattern(pattern = [['']]) {
        this.#form.display = pattern
        return this;
    }
    /**@param {{y:(y: number,line:number,slot:number,player:Player) => { line: number, slot:number },x:(x: number,line:number,slot:number,player:Player) => { line: number, slot:number }}} scripts */
    scripts(scripts = { x, y }) {
        this.#form.scripts.x = scripts.x
        this.#form.scripts.y = scripts.y
        return this;
    }
    offset (offsetX = 0, offsetY = 0) {
        this.#offsetX = Math.min(99, Math.max(0, Math.floor(offsetX)));
        this.#offsetY = Math.min(99, Math.max(0, Math.floor(offsetY)));
    }


    // close the form anytime
    close() {
        system.clearRun(this.#run)
    }
    
    // show method (it needs to be optimized that is a sketch version)

    /**@param {Player} player @param {number} line @param {number} slot @returns {Promise<{line:number,slot:number,cancelled:boolean}>}*/
    show(player, line, slot) {
        // disable player movement
        system.run(() => player.inputPermissions.movementEnabled = false)
        // promise to select what to do after the end of the form
        return new Promise(resolve => {
            system.runTimeout(() => {
                // turbo selection for better user experience
                const state = { turbo: false, ms: 0 };
                
                // runinterval to show the player the form and update it
                let i = 10;
                this.#run = system.runInterval(() => {
                    const mx = -player.inputInfo.getMovementVector().x;
                    const my = -player.inputInfo.getMovementVector().y;
                    const x = mx > 0.7 ? 1 : mx < -0.7 ? -1 : 0;
                    const y = my > 0.7 ? 1 : my < -0.7 ? -1 : 0;
                    
                    // timing
                    if (state.ms > 0) {
                        if (x || y) {
                            state.ms--;
                            return;
                        } else {
                            state.ms = 0;
                        }
                    }

                    // behavior based on what you moved
                    if (y || x) {
                        state.turbo ? (state.ms += 1) : (state.ms += 4);

                        if (x) {
                            try {
                                const { line: l, slot: s } = this.#form.scripts.x(x, line, slot, player); // using x script
                                [line, slot] = [l, s]
                                while (
                                    this.#form.display[line] &&
                                    this.#form.display[line][slot]?.startsWith("#")
                                ) {
                                    this.#form.display[line][slot + x] ? (slot += x) : (slot -= x);
                                }
                                slot = Math.max(0, Math.min(slot, this.#form.display[line].length - 1));
                            } catch (e) {
                                throw new Error('[ActionBarFramework] Error in script x. ' + e)
                            }
                        }

                        if (y) {
                            try {
                                const { line: l, slot: s } = this.#form.scripts.y(y, line, slot, player);// using x script
                                [line, slot] = [l, s]
                                while (
                                    this.#form.display[line] &&
                                    this.#form.display[line].every((btn) => btn.startsWith("#"))
                                ) {
                                    this.#form.display[line + y] ? (line += y) : (line -= y);
                                }
                                line = Math.max(0, Math.min(line, this.#form.display.length - 1));
                                slot = Math.min(slot, this.#form.display[line].length - 1);
                            } catch (e) {
                                throw new Error('[ActionBarFramework] Error in script y. ' + e)
                            }
                        }

                        state.turbo = true;
                    } else state.turbo = false;
                    
                    // display the form
                    const colorA = "§" + this.ui.colors.all // all
                    const colorB = "§" + this.ui.colors.selected // select
                    const colorT = "§" + this.ui.colors.text // text
                    const tick = system.currentTick % 20
                    const tick1 = system.currentTick % 6
                    try {
                        let output = '§f'+ this.#offsetX.toString().padStart(2, '0') + this.#offsetY.toString().padStart(2, '0') +
                            this.ui.background + `§r§${this.ui.colors.title}${this.#title}§r${colorA}\n` +
                            this.#form.display
                                .map((row, rowIndex) => {
                                    return row.map((button, buttonIndex) => {
                                        if (button?.startsWith("#")) {
                                            return `${colorT}${button.slice(1)}§r${colorA}`;
                                        }
                                        if (button?.startsWith("%")) {
                                            if (rowIndex === line && buttonIndex === slot)
                                                return `§l${button.slice(1)}§r${colorA}`;
                                            else return button.slice(1)
                                        }
                                        if (rowIndex === line && buttonIndex === slot) {
                                            return `§l${tick1 > 2 ? colorB : this.ui.render.light}${tick > 9 ? ' -' : '- '}${button}${tick > 9 ? '- ' : ' -'}§r${colorA}`;
                                        }
                                        return `    ${button}    `;
                                    }).join(`§r${colorA}`);
                                }).join("\n");
                        
                            if (this.#type == "slow") {
                                while (output[i-1] == " " || output[i-1] == "§") { i++;}
                                player.onScreenDisplay.setActionBar(output.substring(0,i));
                                i++;
                            }
                            else if (this.#type == "default") {
                                player.onScreenDisplay.setActionBar(output);
                            }


                    } catch (e) {
                        throw new Error('[ActionBarFramework] Unable to dislplay the form. ' + e)
                    }
                    // conclusion
                    if (player.inputInfo.getButtonState(InputButton.Sneak) === "Pressed" && this.cancellable == true) {
                        player.onScreenDisplay.setActionBar('§f'+ this.#offsetX.toString().padStart(2, '0') + this.#offsetY.toString().padStart(2, '0') +"§c§lCanceled");
                        system.runTimeout(() => (player.inputPermissions.movementEnabled = true), 4);
                        resolve({ line: undefined, slot: undefined, cancelled: true });
                        system.clearRun(this.#run);
                    }

                    if (player.inputInfo.getButtonState(InputButton.Jump) === "Pressed") {
                        if (['#', '%'].some(k => this.#form.display[line][slot]?.startsWith(k))) return;
                        //player.onScreenDisplay.setActionBar('§f'+ this.#offsetX.toString().padStart(2, '0') + this.#offsetY.toString().padStart(2, '0') +"§a§l" + this.#form.display[line][slot]);
                        
                        system.runTimeout(() => {
                            player.inputPermissions.movementEnabled = true;
                            resolve({ line, slot, cancelled: false })
                            player.onScreenDisplay.setActionBar(" ");
                        }, 4);
                        system.clearRun(this.#run);
                        player.onScreenDisplay.setActionBar(" ");
                    }
                });
            }, 1)
        })
    }
}
