
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
        valuesRange: "-2000000000_2000000000",
        increament: 1,
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
    show(player, line = 0, slot = 0, devmode = false) {
        // disable player movement
        system.run(() => player.inputPermissions.movementEnabled = false)
        // promise to select what to do after the end of the form
        return new Promise(resolve => {
            system.runTimeout(() => {
                // turbo selection for better user experience
                const state = { turbo: false, ms: 0 };


                const colorA = "§" + this.ui.colors.all // all // update: define colors outside the system.runinterval
                const colorB = "§" + this.ui.colors.selected // select
                const colorT = "§" + this.ui.colors.text // text


                const filtered = [];

                // Iterate over each row and each string in the row
                this.#form.display.forEach((row, rowIndex) => {
                  row.forEach((str, colIndex) => {
                    // Check if the string does NOT start with '#'
                    if (!str.startsWith("#")) {
                      // Store the string and its original indices in an object
                      filtered.push({
                        row: rowIndex,
                        col: colIndex,
                        value: str
                      });
                    }
                  });
                });
                if (!filtered.length) {
                    line = 0;
                    slot = 0;
                }

                let foundIndex = false;

                //decide which button should be selected if the one passed through show() is invalid
                if (this.#form.display[line][slot].startsWith("#")) {
                    for (let i = 0; i < this.#form.display.length; i++) {
                        for (let j = 0; j < this.#form.display[i].length; j++) {
                            if (this.#form.display[i][j] && !this.#form.display[i][j].startsWith("#")) {
                                line = i;
                                slot = j;  // Store row & column index
                                foundIndex = true;
                                break;
                            }
                        }
                        if (foundIndex) break; // Stop looping if found
                    }
                }



                // runinterval to show the player the form and update it
                let i = 10;
                let locked = false;
                let lastInput = 0; //stop double input
                let loaded = true;
                if (this.#type === "slow") loaded = false;
                this.#run = system.runInterval(() => {
                    const mx = -player.inputInfo.getMovementVector().x;
                    const my = -player.inputInfo.getMovementVector().y;
                    const x = mx > 0.7 ? 1 : mx < -0.7 ? -1 : 0;
                    const y = my > 0.7 ? 1 : my < -0.7 ? -1 : 0;

                    if (devmode) {
                        player.onScreenDisplay.setTitle("§a", {subtitle: `offset x: ${this.#offsetX}, offset y: ${this.#offsetY}`, fadeInDuration: 0, fadeOutDuration: 0, stayDuration: 11})
                    }
                    
                    // timing
                    if (state.ms > 0) {
                        if (x || y) {
                            state.ms--;
                            return;
                        } else {
                            state.ms = 0;
                        }
                    }
                    if ((y || x) && !locked && !devmode) {//handle movement
                        state.turbo ? (state.ms += 1) : (state.ms += 4);
                        if(x) {
                            const found = filtered.find(item => item.row === line && item.col === x + slot);
                            if (found) {
                                line = found.row;
                                slot = found.col;
                            }
                            else {
                                if (x>0) {
                                    const found = filtered.find(item => item.row === line && item.col > slot);
                                    if (found) {
                                        slot = found.col;
                                    }
                                }
                                else if (x<0) {
                                    const found = filtered.slice().reverse().find(item => item.row === line && item.col < slot);;
                                    if (found) {
                                        slot = found.col;
                                    }
                                }
                            }
                        }
                        if (y) {
                            const found = filtered.find(item => item.row === line + y && item.col === slot);
                            if (found) {
                                line = found.row;
                                slot = found.col;
                            }
                            else {
                                if (y>0) {
                                    const candidates = filtered.filter(item => item.row > line);

                                    if (candidates.length > 0) {
                                        const nextLine = Math.min(...candidates.map(item => item.row));
                                
                                        const nextLineItems = candidates.filter(item => item.row === nextLine);
                                
                                        const closestItem = nextLineItems.reduce((closest, item) => {
                                            return Math.abs(item.col - slot) < Math.abs(closest.col - slot) ? item : closest;
                                        }, nextLineItems[0]);
                                
                                        line = closestItem.row;
                                        slot = closestItem.col;
                                    }
                                }
                                else if (y<0) {
                                    const candidates = filtered.filter(item => item.row < line);
    
                                    if (candidates.length > 0) {
                                        const prevLine = Math.max(...candidates.map(item => item.row));
                                
                                        const prevLineItems = candidates.filter(item => item.row === prevLine);
                                
                                        const closestItem = prevLineItems.reduce((closest, item) => {
                                            return Math.abs(item.col - slot) < Math.abs(closest.col - slot) ? item : closest;
                                        }, prevLineItems[0]);
                                
                                        line = closestItem.row;
                                        slot = closestItem.col;
                                    }     
                                }
                            }
                        }
                        state.turbo = true;
                    }
                    else if(devmode) {
                        if (x) {
                            this.#offsetX += x;
                            if (this.#offsetX > 99) this.#offsetX = 99;
                            if (this.#offsetX < 0) this.#offsetX = 0;
                        }
                        if (y) {
                            this.#offsetY += y;
                            if (this.#offsetY > 99) this.#offsetY = 99;
                            if (this.#offsetY < 0) this.#offsetY = 0;
                        }
                    }

                    else if (y && locked) {
                        state.turbo ? (state.ms += 1) : (state.ms += 4);
                        let increament;
                        try {
                            increament = JSON.parse(this.#form.display[line][slot].split(" ")[2]);
                        }catch {
                            increament = this.settings.increament;
                        }
                        let value = JSON.parse(this.#form.display[line][slot].split(" ")[0].replace("%", "")) - (y * increament ?? 1);
                        try {
                            const min = JSON.parse(this.#form.display[line][slot].split(" ")[1].split("_")[0]);
                            const max = JSON.parse(this.#form.display[line][slot].split(" ")[1].split("_")[1]);
                            if (value > max) value = max;
                            if (value < min) value = min;
                        }
                        catch {
                            const min = JSON.parse(this.settings.valuesRange.split("_")[0]);
                            const max = JSON.parse(this.settings.valuesRange.split("_")[1]);
                            if (value > max) value = max;
                            if (value < min) value = min;
                        }
                        const newValue = "%" + JSON.stringify(value) + " " + this.#form.display[line][slot].split(" ")[1] + " " + JSON.stringify(increament);
                        this.#form.display[line][slot] = newValue;
                    }
                    else state.turbo = false;
                    
                    // display the form
                    const tick = system.currentTick % 20
                    const tick1 = system.currentTick % 6
                    if (x || y || tick1 == 2 || tick == 9 || !loaded) // update: dont update the form when not needed
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
                                                return `§l${tick1 > 2 ? "" : this.ui.render.light}${tick > 9 ? ' -' : '- '}${locked? '§a': ''}${button.slice(1).split(" ")[0]}${tick > 9 ? '- ' : ' -'}§r${colorA}`;
                                                else return button.slice(1).split(" ")[0]
                                            }
                                            if (button?.startsWith("@")) {
                                                if (rowIndex === line && buttonIndex === slot)
                                                return `§l${tick1 > 2 ? "" : this.ui.render.light}${tick > 9 ? ' -' : '- '}${button?.includes("§o§n")? '§a' : ''}${button.slice(1)}${tick > 9 ? '- ' : ' -'}§r${colorA}`;
                                                else if (button?.includes("§o§n")) return `§a${button.slice(1)}`
                                                else return button.slice(1)
                                            }
                                            if (button?.startsWith("$")) {
                                                if (rowIndex === line && buttonIndex === slot)
                                                    return button.startsWith("$false") ? "" : "";
                                                else return button.startsWith("$false") ? "" : "";
                                            }
                                            if (rowIndex === line && buttonIndex === slot) {
                                                return `§l${tick1 > 2 ? colorB : this.ui.render.light}${tick > 9 ? ' -' : '- '}${button}${tick > 9 ? '- ' : ' -'}§r${colorA}`;
                                            }
                                            return `    ${button}    `;
                                        }).join(`§r${colorA}`);
                                    }).join("\n");
                                if (this.#type == "slow") {
                                    while (output[i-1] == " " || output[i-1] == "§" || output[i] == " ") { i++;}
                                    player.onScreenDisplay.setActionBar(output.substring(0,i) + "\n".repeat(output.split("\n").length - (output.substring(0,i).split("\n").length - 1))); // needs some calcs to create the background without text
                                    i++;
                                    if (i >= output.length -1) loaded = true;
                                }
                                else if (this.#type == "default") {
                                    player.onScreenDisplay.setActionBar(output);
                                }
                        } catch (e) {
                            throw new Error('[ActionBarFramework] Unable to dislplay the form. ' + e)
                        }
                    // conclusion
                    if (player.inputInfo.getButtonState(InputButton.Sneak) === "Pressed" && (this.cancellable == true || devmode)) {
                        player.onScreenDisplay.setActionBar('§f'+ this.#offsetX.toString().padStart(2, '0') + this.#offsetY.toString().padStart(2, '0') +"§c§lCanceled");
                        system.runTimeout(() => (player.inputPermissions.movementEnabled = true), 4);
                        resolve({ line: undefined, slot: undefined, cancelled: true, values:undefined });
                        system.clearRun(this.#run);
                    }

                    if (player.inputInfo.getButtonState(InputButton.Jump) === "Pressed" && loaded) {
                        //stop unintentional double input by setting a delay of 200 ms
                        if (Date.now() - lastInput < 200) {
                            lastInput = Date.now();
                            return;
                        }
                        lastInput = Date.now();
                        
                        if (['#'].some(k => this.#form.display[line][slot]?.startsWith(k)) && filtered.length) return;
                        else if (['#'].some(k => this.#form.display[line][slot]?.startsWith(k)) && !filtered.length) {
                            system.runTimeout(() => {
                                player.inputPermissions.movementEnabled = true;
                                resolve({ line: undefined, slot: undefined, cancelled: false, values:undefined });
                                player.onScreenDisplay.setActionBar(" ");
                            }, 4);
                            system.clearRun(this.#run);
                            player.onScreenDisplay.setActionBar(" ");
                        }
                        if (['%'].some(k => this.#form.display[line][slot]?.startsWith(k))) {
                            locked = !locked;
                            return;
                        }
                        if (this.#form.display[line][slot]?.startsWith("$")) {
                            let value = JSON.parse(this.#form.display[line][slot].slice(1));
                            this.#form.display[line][slot] = "$" + JSON.stringify(!value);
                            return;
                        }
                        if (this.#form.display[line][slot]?.startsWith("@")) {
                            if (this.#form.display[line][slot].includes("§o§n")) {
                                this.#form.display[line][slot] = this.#form.display[line][slot].replace("§o§n", "§o§f§f");
                            }
                            else if (this.#form.display[line][slot].includes("§o§f§f")) {
                                this.#form.display[line][slot] = this.#form.display[line][slot].replace("§o§f§f", "§o§n");
                            }
                            else {
                                this.#form.display[line][slot] = this.#form.display[line][slot] + "§o§n§r"
                            }
                            return;
                        }
                        const values = [];
                        this.#form.display.forEach((row, rowIndex) => {
                            row.forEach((str, colIndex) => {
                              if (str.startsWith("%")) {
                                  values.push({
                                    line: rowIndex,
                                    slot: colIndex,
                                    type: "number",
                                    value: JSON.parse(str.slice(1).split(" ")[0])
                                  });
                                }
                                if (str.startsWith("$")) {
                                    values.push({
                                      line: rowIndex,
                                      slot: colIndex,
                                      type: "toggle",
                                      value: JSON.parse(str.slice(1).split(" ")[0])
                                    });
                                }
                                if (str.startsWith("@")) {
                                    if (str.includes("§o§n")) {
                                        values.push({
                                            line: rowIndex,
                                            slot: colIndex,
                                            type: "checkbox",
                                            value: str.slice(1).replace("§o§n§r", "")
                                          });
                                    }
                                }
                            });
                          });

                        system.runTimeout(() => {
                            player.inputPermissions.movementEnabled = true;
                            resolve({ line, slot, cancelled: false, values })
                            player.onScreenDisplay.setActionBar(" ");
                        }, 4);
                        system.clearRun(this.#run);
                        player.onScreenDisplay.setActionBar(" ");
                    }
                    //if the user pressed jump in slow mode while the form isn't fully loaded it instantly loads
                    else if(player.inputInfo.getButtonState(InputButton.Jump) === "Pressed" && !loaded) {
                        if (Date.now() - lastInput < 200) {
                            lastInput = Date.now();
                            return;
                        }
                        lastInput = Date.now();
                        i+= 1000;
                    }
                });
            }, 1)
        })
    }
}
