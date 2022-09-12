# Soul Surf
Resurrect corpses to complete levels.

## **CONTROLS**
### Soul
* Arrow keys = Move
* X = Resurrect corpse

### Entity
* Arrow keys = Move
* Down arrow = Enter door / Toggle switch
* X = Attack

### General
* R = Reset
* 0 = Level Editor

## **LEVEL EDITOR GUIDE**
### Empty (0)

### Block (1)
* **Param 1** Block type

### Soul Spawn (2)
Starting point for the soul

### Entity Spawn (3)
Spawns a character

* **Param 1** - Character type

* **Param 2** - Dead / Alive

### Pickup (4)
Spawns a key (no params)

### Door (5)
Takes player to next level

### Laser turret (6)
Shoots laser that kills the player
* **Param 1** - Switch ID
* **Param 2** - On by default

### Hologram block (7)
Acts as a block if switched on
* **Param 1** - Switch ID
* **Param 2** - On by default

### Switch (8)
Toggles
* **Param 1** - Switch ID
* **Param 2** - On by default
* **Param 3** - Timer

### Spikes (9)
Kills player
