
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

export class Line {
    #content = [];

    constructor(arr = []) {
        this.#content = arr;
        return this;
    }

    set(arr) {
        if (Array.isArray(arr) && arr.every(item => typeof item === 'string')) {
            this.#content = arr;
        }
        return this;
    }

    add(item, isText = false) {
        if (typeof item === 'string') {
            const formattedItem = isText ? `#${item}` : item;
            this.#content.push(formattedItem);
        }
        return this;
    }

    insertAt(index, item, isText = false) {
        if (typeof item === 'string') {
            const formattedItem = isText ? `#${item}` : item;
            this.#content.splice(index, 0, formattedItem);
        }
        return this;
    }

    replace(index, item, isText = false) {
        if (typeof item === 'string' && index >= 0 && index < this.#content.length) {
            const formattedItem = isText ? `#${item}` : item;
            this.#content.splice(index, 1, formattedItem);
        }
        return this;
    }

    remove(index) {
        if (index >= 0 && index < this.#content.length) {
            this.#content.splice(index, 1);
        }
        return this;
    }

    get() {
        return this.#content;
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

    addLine(line) {
        this.#form.display.push(line.get());
        return this;
    }
    removeLine(index) {
        this.#form.display.splice(index, 1);
        return this;
    }
    replaceLine(index, line) {
        this.#form.display.splice(index, 1, line.get());
        return this;
    }
    insertLineAt(index, line) {
        this.#form.display.splice(index, 0, line.get());
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


                const colorA = "§" + this.ui.colors.all // all // update: define colors outside the system.runinterval
                const colorB = "§" + this.ui.colors.selected // select
                const colorT = "§" + this.ui.colors.text // text

                let foundIndex = false;

                //decide which button should be selected if the one passed through show() is invalid
                if (this.#form.display[line][slot].startsWith("#")) {
                    for (let i = 0; i < this.#form.display.length; i++) {
                        for (let j = 0; j < this.#form.display[i].length; j++) {
                            if (!this.#form.display[i][j].startsWith("#")) {
                                line = i;
                                slot = j;  // Store row & column index
                                foundIndex = true;
                                break;
                            }
                        }
                        if (foundIndex) break; // Stop looping if found
                    }
                }
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

                
                // runinterval to show the player the form and update it
                let i = 10;
                let locked = false;
                let lastInput = 0; //stop double input
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
                    if ((y || x) && !locked) {
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
                                    const found = filtered.find(item => item.row === line && item.col < slot);
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
                                    const found = filtered.find(item => item.row > line && item.col === slot);
                                    if (found) {
                                        line = found.row;
                                    }
                                    else {
                                        const candidates = filtered.filter(item => item.row > line);

                                        if (candidates.length > 0) {
                                          // Find the next existing line (i.e. the smallest row number)
                                          const nextLine = Math.min(...candidates.map(item => item.row));
                                      
                                          // Filter candidates to only those in the next line.
                                          const nextLineCandidates = candidates.filter(item => item.row === nextLine);
                                      
                                          // Find the candidate in this row with the col closest to slot.
                                          const found = nextLineCandidates.reduce((closest, item) => {
                                            // If closest is not set, return the current item
                                            if (!closest) return item;
                                            // Compare the absolute difference in col values
                                            return (Math.abs(item.col - slot) < Math.abs(closest.col - slot)) ? item : closest;
                                          }, null);
                                          if (found) {
                                            line = found.row;
                                            slot = found.col;
                                          }
                                        }
                                    }
                                }
                                else if (y<0) {
                                    const found = filtered.find(item => item.row < line && item.col === slot);
                                    if (found) {
                                        line = found.row;
                                    }
                                    else {
                                        const candidates = filtered.filter(item => item.row < line);

                                        if (candidates.length > 0) {
                                          // Find the largest row (i.e. the row closest to line but less than it)
                                          const prevLine = Math.max(...candidates.map(item => item.row));
                                      
                                          // Filter candidates to only those in the prevLine.
                                          const prevLineCandidates = candidates.filter(item => item.row === prevLine);
                                      
                                          // Find the candidate in this row with the col closest to slot.
                                          const found = prevLineCandidates.reduce((closest, item) => {
                                            // If closest is not set, return the current item
                                            if (!closest) return item;
                                            // Compare the absolute difference in col values
                                            return (Math.abs(item.col - slot) < Math.abs(closest.col - slot)) ? item : closest;
                                          }, null);
                                          if (found) {
                                            line = found.row;
                                            slot = found.col;
                                          }
                                        }
                                    }
                                }
                            }
                        }
                        state.turbo = true;
                    }

                    else if (y && locked) {
                        const value = JSON.parse(this.#form.display[line][slot].replace("%", ""));
                        const newValue = "%" + JSON.stringify(value - y);
                        this.#form.display[line][slot] = newValue;
                    }
                    else state.turbo = false;
                    
                    // display the form
                    const tick = system.currentTick % 20
                    const tick1 = system.currentTick % 6
                    if (x || y || tick1 == 2 || tick == 9) // update: dont update the form when not needed
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
                                                    //return `§l${button.slice(1)}§r${colorA}`;
                                                return `§l${tick1 > 2 ? "" : this.ui.render.light}${tick > 9 ? ' -' : '- '}${button}${tick > 9 ? '- ' : ' -'}§r${colorA}`;
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
                                    player.onScreenDisplay.setActionBar(output.substring(0,i) + new Array(output.lenght).fill(' ').join('')); // needs some calcs to create the background without text
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
                        //stop unintentional double input by setting a delay of 200 ms
                        if (Date.now() - lastInput < 200) {
                            lastInput = Date.now();
                            return;
                        }
                        lastInput = Date.now();
                        
                        if (['#'].some(k => this.#form.display[line][slot]?.startsWith(k))) return;
                        if (['%'].some(k => this.#form.display[line][slot]?.startsWith(k))) {
                            locked = !locked;
                            return;
                        }

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
