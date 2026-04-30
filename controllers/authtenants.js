import Tenant from '../models/Tenant.js';
import Room from '../models/Room.js';

export const createTenant = async (req, res) => {
    try {
        const { currentRoom } = req.body;

        // 1. Save Tenant (Hook in model handles 'amount')
        const newTenant = new Tenant(req.body);
        const savedTenant = await newTenant.save();

        // 2. Update Room Occupancy
        if (currentRoom) {
            const room = await Room.findById(currentRoom);
            room.occupancy = (room.occupancy || 0) + 1;
            
            
            if (room.occupancy >= room.capacity) {
                room.status = 'Full';
            } else if (room.occupancy>0) {
                room.status = 'Partial';
            }else{
              room.status='Available'
            }
            await room.save();
        }

        res.status(201).json(savedTenant);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const updateTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;
        const oldTenant = await Tenant.findById(id);

        if (!oldTenant) return res.status(404).json({ message: "Tenant not found" });

        const oldRoomId = oldTenant.currentRoom?.toString();
        const newRoomId = updatedData.currentRoom;

        if (newRoomId && newRoomId !== oldRoomId) {
            // --- 1. CLEAN UP OLD ROOM ---
            if (oldRoomId) {
                const oldRoom = await Room.findById(oldRoomId);
                if (oldRoom) {
                    oldRoom.occupancy = Math.max(0, (oldRoom.occupancy || 1) - 1);
                    // DYNAMIC STATUS LOGIC
                    if (oldRoom.occupancy === 0) oldRoom.status = 'Available';
                    else oldRoom.status = 'Partial'; 
                    await oldRoom.save();
                }
            }

            // --- 2. UPDATE NEW ROOM ---
            const newRoom = await Room.findById(newRoomId);
            if (newRoom) {
                newRoom.occupancy = (newRoom.occupancy || 0) + 1;
                // DYNAMIC STATUS LOGIC
                if (newRoom.occupancy >= newRoom.capacity) newRoom.status = 'Full';
                else newRoom.status = 'Partial';
                await newRoom.save();
            }
        }

        Object.assign(oldTenant, updatedData);
        const updatedTenant = await oldTenant.save();
        res.status(200).json(updatedTenant);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const availableRoom = async (req, res) => {
    try {
        // Fetch rooms that have space
        const rooms = await Room.find({
            status: { $in: ['Available', 'partial'] },
            $expr: { $lt: ["$occupancy", "$capacity"] }
        });
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getTenants = async (req, res) => {
    try {
        const tenants = await Tenant.find().populate('currentRoom');
        res.status(200).json(tenants);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export const deleteTenant = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Find the tenant first to get the room ID
        const tenant = await Tenant.findById(id);
        if (!tenant) {
            return res.status(404).json({ success: false, message: "Tenant not found" });
        }

        // 2. Handle Room Sync if the tenant was assigned to a room
        if (tenant.currentRoom) {
            const room = await Room.findById(tenant.currentRoom);
            
            if (room) {
                // Decrement occupancy but never go below 0
                const currentOccupancy = room.occupancy || 0;
                room.occupancy = Math.max(0, currentOccupancy - 1);
                
                // Set status based on new occupancy count
                if (room.occupancy === 0) {
                    room.status = 'Available';
                } else {
                    // Even if it was 'Full', it is now 'Partial'
                    room.status = 'partial'; 
                }
                
                await room.save();
            }
        }

        // 3. Finally delete the tenant
        await Tenant.findByIdAndDelete(id);

        res.status(200).json({ 
            success: true, 
            message: "Tenant deleted and room occupancy updated successfully." 
        });

    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};


