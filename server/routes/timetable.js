const express = require('express');
const router = express.Router();
const { supabase } = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');
const multer = require('multer');
const xlsx = require('xlsx');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ─────────────────────────────────────────────────────────────
// Helper: extract building code from room code
// ─────────────────────────────────────────────────────────────
function extractBuilding(room) {
  if (!room) return 'Other';
  if (room === 'Music Room') return 'Music Room';
  const match = room.match(/^([A-Z]+)/);
  return match ? match[1] : room;
}

// ─────────────────────────────────────────────────────────────
// Helper: compare HH:MM time strings
// ─────────────────────────────────────────────────────────────
function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// ─────────────────────────────────────────────────────────────
// GET /api/timetable/buildings  — List all buildings in DB
// Public — requires login (handled by frontend route guard)
// ─────────────────────────────────────────────────────────────
router.get('/buildings', protect, async (req, res) => {
  try {
    let allBuildingsData = [];
    let from = 0;
    const step = 1000;
    while (true) {
      const { data, error } = await supabase
        .from('timetable_slots')
        .select('building')
        .neq('building', null)
        .range(from, from + step - 1);
      
      if (error) throw error;
      if (!data || data.length === 0) break;
      
      allBuildingsData = allBuildingsData.concat(data);
      if (data.length < step) break;
      from += step;
    }

    const buildings = [...new Set(allBuildingsData.map(r => r.building))].filter(Boolean).sort();
    res.json({ success: true, buildings });
  } catch (err) {
    console.error('[Timetable] buildings error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/timetable/rooms
// Query: building, day (MON|TUE|…), time (HH:MM)
// Returns all rooms in the building with current + next slot
// ─────────────────────────────────────────────────────────────
router.get('/rooms', protect, async (req, res) => {
  try {
    const { building, day, time } = req.query;
    if (!building || !day || !time) {
      return res.status(400).json({ success: false, message: 'building, day, and time are required' });
    }

    const dayUpper = day.toUpperCase();
    const queryMinutes = timeToMinutes(time);

    // Fetch ALL slots for this building+day
    const { data: slots, error } = await supabase
      .from('timetable_slots')
      .select('*')
      .eq('building', building)
      .eq('day', dayUpper)
      .order('room')
      .order('start_time')
      .limit(10000);

    if (error) throw error;

    // Also fetch all rooms in this building (across all days) to include rooms with no Monday class etc.
    let allRoomData = [];
    let roomFrom = 0;
    const roomStep = 1000;
    while (true) {
      const { data, error } = await supabase
        .from('timetable_slots')
        .select('room')
        .eq('building', building)
        .range(roomFrom, roomFrom + roomStep - 1);
        
      if (error) throw error;
      if (!data || data.length === 0) break;
      
      allRoomData = allRoomData.concat(data);
      if (data.length < roomStep) break;
      roomFrom += roomStep;
    }

    const allRooms = [...new Set(allRoomData.map(r => r.room))].sort();

    // Group slots by room
    const byRoom = {};
    (slots || []).forEach(slot => {
      if (!byRoom[slot.room]) byRoom[slot.room] = [];
      byRoom[slot.room].push(slot);
    });

    // Build response for each room
    const rooms = allRooms.map(room => {
      const todaySlots = (byRoom[room] || []).sort((a, b) =>
        timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
      );

      // Find current slot (overlaps query time)
      const currentSlot = todaySlots.find(s =>
        timeToMinutes(s.start_time) <= queryMinutes &&
        queryMinutes < timeToMinutes(s.end_time)
      ) || null;

      // Find next slot (starts after query time)
      const nextSlot = todaySlots.find(s =>
        timeToMinutes(s.start_time) > queryMinutes
      ) || null;

      // Determine status
      let status = 'free';
      if (currentSlot) {
        status = 'occupied';
      } else if (nextSlot && timeToMinutes(nextSlot.start_time) - queryMinutes <= 45) {
        status = 'busy_soon';
      }

      return {
        room,
        building,
        status,
        current: currentSlot ? {
          subject: currentSlot.subject,
          sessionType: currentSlot.session_type,
          teacher: currentSlot.teacher,
          startTime: currentSlot.start_time,
          endTime: currentSlot.end_time,
          classCode: currentSlot.class_code,
          program: currentSlot.program,
        } : null,
        next: nextSlot ? {
          subject: nextSlot.subject,
          sessionType: nextSlot.session_type,
          teacher: nextSlot.teacher,
          startTime: nextSlot.start_time,
          endTime: nextSlot.end_time,
          classCode: nextSlot.class_code,
        } : null,
        todaySlots: todaySlots.map(s => ({
          subject: s.subject,
          sessionType: s.session_type,
          teacher: s.teacher,
          startTime: s.start_time,
          endTime: s.end_time,
          classCode: s.class_code,
          program: s.program,
        })),
      };
    });

    res.json({
      success: true,
      building,
      day: dayUpper,
      queryTime: time,
      rooms,
    });
  } catch (err) {
    console.error('[Timetable] rooms error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/timetable/room/:room  — Full week schedule for one room
// ─────────────────────────────────────────────────────────────
router.get('/room/:room', protect, async (req, res) => {
  try {
    const { data: slots, error } = await supabase
      .from('timetable_slots')
      .select('*')
      .eq('room', req.params.room)
      .order('day')
      .order('start_time');

    if (error) throw error;

    // Group by day
    const dayOrder = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const byDay = {};
    dayOrder.forEach(d => { byDay[d] = []; });
    (slots || []).forEach(s => {
      if (byDay[s.day] !== undefined) byDay[s.day].push(s);
    });

    res.json({ success: true, room: req.params.room, schedule: byDay });
  } catch (err) {
    console.error('[Timetable] room schedule error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/timetable/meta  — Active semester info (public for display)
// ─────────────────────────────────────────────────────────────
router.get('/meta', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('timetable_meta')
      .select('*')
      .eq('is_active', true)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    res.json({ success: true, meta: data || null });
  } catch (err) {
    console.error('[Timetable] meta error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ══════════════════════════════════════════════════════════════
// ADMIN ROUTES — require protect + adminOnly
// ══════════════════════════════════════════════════════════════

// GET /api/timetable/admin/meta — List all upload history
router.get('/admin/meta', protect, adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('timetable_meta')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, uploads: data || [] });
  } catch (err) {
    console.error('[Timetable Admin] meta list error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/timetable/admin/upload — Parse Excel and replace timetable
router.post('/admin/upload', protect, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No Excel file uploaded' });
    }

    const semesterLabel = (req.body.semester_label || 'Timetable 2026-2027').trim();

    // Parse Excel from buffer
    const wb = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rawRows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });

    // Validate header
    const header = rawRows[0];
    const expectedCols = ['Program', 'Year', 'Class Code', 'Section', 'Day', 'Start Time', 'End Time', 'Subject', 'Session Type', 'Room', 'Teacher'];
    const missingCols = expectedCols.filter(col => !header.includes(col));
    if (missingCols.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid Excel format. Missing columns: ${missingCols.join(', ')}`
      });
    }

    // Map column indices
    const colIdx = {};
    expectedCols.forEach(col => { colIdx[col] = header.indexOf(col); });

    // Parse rows
    const dataRows = rawRows.slice(1).filter(row =>
      row[colIdx['Room']] && row[colIdx['Day']] && row[colIdx['Start Time']] && row[colIdx['End Time']]
    );

    const slots = dataRows.map(row => ({
      program: String(row[colIdx['Program']] || '').trim(),
      year: String(row[colIdx['Year']] || '').trim(),
      class_code: String(row[colIdx['Class Code']] || '').trim(),
      section: String(row[colIdx['Section']] || '').trim(),
      day: String(row[colIdx['Day']] || '').trim().toUpperCase(),
      start_time: String(row[colIdx['Start Time']] || '').trim(),
      end_time: String(row[colIdx['End Time']] || '').trim(),
      subject: String(row[colIdx['Subject']] || '').trim(),
      session_type: String(row[colIdx['Session Type']] || '').trim(),
      room: String(row[colIdx['Room']] || '').trim(),
      building: extractBuilding(String(row[colIdx['Room']] || '').trim()),
      teacher: String(row[colIdx['Teacher']] || '').trim(),
      semester_label: semesterLabel,
    }));

    if (slots.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid data rows found in the Excel file' });
    }

    // 1. Mark all existing meta as inactive
    await supabase.from('timetable_meta').update({ is_active: false }).neq('id', 0);

    // 2. Delete old slots for this semester (or all)
    await supabase.from('timetable_slots').delete().neq('id', 0);

    // 3. Bulk insert in chunks of 500
    const chunkSize = 500;
    for (let i = 0; i < slots.length; i += chunkSize) {
      const chunk = slots.slice(i, i + chunkSize);
      const { error: insertErr } = await supabase.from('timetable_slots').insert(chunk);
      if (insertErr) throw insertErr;
    }

    // 4. Create new meta record
    const { data: meta, error: metaErr } = await supabase
      .from('timetable_meta')
      .insert({
        semester_label: semesterLabel,
        uploaded_by: req.user?.id || null,
        is_active: true,
        row_count: slots.length,
      })
      .select()
      .single();

    if (metaErr) throw metaErr;

    res.json({
      success: true,
      message: `Timetable uploaded successfully. ${slots.length} slots imported.`,
      meta,
    });
  } catch (err) {
    console.error('[Timetable Admin] upload error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error during upload' });
  }
});

// DELETE /api/timetable/admin/clear — Clear all timetable data
router.delete('/admin/clear', protect, adminOnly, async (req, res) => {
  try {
    await supabase.from('timetable_slots').delete().neq('id', 0);
    await supabase.from('timetable_meta').delete().neq('id', 0);
    res.json({ success: true, message: 'All timetable data cleared.' });
  } catch (err) {
    console.error('[Timetable Admin] clear error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
