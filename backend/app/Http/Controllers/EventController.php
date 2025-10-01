<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use App\Models\Event;
use App\Models\Attendee;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Writer\Csv;

class EventController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Event::with(['creator', 'attendees'])
            ->withCount(['attendees as total_attendees', 'attendees as checked_in_attendees' => function ($query) {
                $query->where('is_checked_in', true);
            }]);

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Search by name if provided
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $events = $query->orderBy('event_date', 'desc')->paginate(15);

        return response()->json($events);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Parse custom_fields from JSON string if it's a string (from multipart/form-data)
        $requestData = $request->all();
        if (isset($requestData['custom_fields']) && is_string($requestData['custom_fields'])) {
            $requestData['custom_fields'] = json_decode($requestData['custom_fields'], true);
        }

        $validator = Validator::make($requestData, [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'venue' => 'required|string|max:255',
            'event_date' => 'required|date|after:today',
            'event_time' => 'required',
            'max_attendees' => 'nullable|integer|min:1',
            'custom_fields' => 'nullable|array',
            'banner' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'event_logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $data = $validator->validated();
        $data['created_by'] = auth()->id();

        // Handle file uploads
        if ($request->hasFile('banner')) {
            $data['banner'] = $request->file('banner')->store('events/banners', 'public');
        }

        if ($request->hasFile('event_logo')) {
            $data['event_logo'] = $request->file('event_logo')->store('events/logos', 'public');
        }

        $event = Event::create($data);

        return response()->json([
            'message' => 'Event created successfully',
            'event' => $event->load('creator')
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Event $event)
    {
        return response()->json($event->load(['creator', 'attendees' => function ($query) {
            $query->orderBy('created_at', 'desc');
        }]));
    }

    /**
     * Show event for public registration
     */
    public function showPublic($slug)
    {
        $event = Event::where('slug', $slug)
            ->where('status', 'published')
            ->where('is_active', true)
            ->firstOrFail();

        return response()->json([
            'event' => $event,
            'is_full' => $event->isFull(),
            'attendees_count' => $event->totalAttendeesCount(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Event $event)
    {
        // Parse custom_fields from JSON string if it's a string (from multipart/form-data)
        $requestData = $request->all();
        if (isset($requestData['custom_fields']) && is_string($requestData['custom_fields'])) {
            $requestData['custom_fields'] = json_decode($requestData['custom_fields'], true);
        }

        $validator = Validator::make($requestData, [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'venue' => 'required|string|max:255',
            'event_date' => 'required|date',
            'event_time' => 'required',
            'max_attendees' => 'nullable|integer|min:1',
            'custom_fields' => 'nullable|array',
            'status' => 'required|in:draft,published,closed',
            'banner' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'event_logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $data = $validator->validated();

        // Handle file uploads
        if ($request->hasFile('banner')) {
            // Delete old banner
            if ($event->banner) {
                Storage::disk('public')->delete($event->banner);
            }
            $data['banner'] = $request->file('banner')->store('events/banners', 'public');
        }

        if ($request->hasFile('event_logo')) {
            // Delete old logo
            if ($event->event_logo) {
                Storage::disk('public')->delete($event->event_logo);
            }
            $data['event_logo'] = $request->file('event_logo')->store('events/logos', 'public');
        }

        $event->update($data);

        return response()->json([
            'message' => 'Event updated successfully',
            'event' => $event->load('creator')
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Event $event)
    {
        // Delete associated files
        if ($event->banner) {
            Storage::disk('public')->delete($event->banner);
        }
        if ($event->event_logo) {
            Storage::disk('public')->delete($event->event_logo);
        }

        $event->delete();

        return response()->json(['message' => 'Event deleted successfully']);
    }

    /**
     * Toggle event status
     */
    public function toggleStatus(Event $event)
    {
        $event->update(['is_active' => !$event->is_active]);

        return response()->json([
            'message' => 'Event status updated successfully',
            'event' => $event
        ]);
    }

    /**
     * Generate event report
     */
    public function generateReport(Event $event, Request $request)
    {
        $query = $event->attendees();

        // Apply filters
        if ($request->has('ticket_type')) {
            $query->where('ticket_type', $request->ticket_type);
        }

        if ($request->has('company')) {
            $query->where('company', 'like', '%' . $request->company . '%');
        }

        if ($request->has('checked_in')) {
            $query->where('is_checked_in', $request->boolean('checked_in'));
        }

        $attendees = $query->get();

        return response()->json([
            'event' => $event,
            'statistics' => [
                'total_registered' => $attendees->count(),
                'checked_in' => $attendees->where('is_checked_in', true)->count(),
                'not_checked_in' => $attendees->where('is_checked_in', false)->count(),
                'by_ticket_type' => $attendees->groupBy('ticket_type')->map->count(),
                'by_company' => $attendees->whereNotNull('company')->groupBy('company')->map->count(),
            ],
            'attendees' => $attendees
        ]);
    }

    /**
     * Export event data
     */
    public function exportData(Event $event, $format, Request $request)
    {
        $query = $event->attendees();

        // Apply filters (same as generateReport)
        if ($request->has('ticket_type')) {
            $query->where('ticket_type', $request->ticket_type);
        }

        if ($request->has('company')) {
            $query->where('company', 'like', '%' . $request->company . '%');
        }

        if ($request->has('checked_in')) {
            $query->where('is_checked_in', $request->boolean('checked_in'));
        }

        $attendees = $query->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Headers
        $headers = [
            'Registration ID', 'Name', 'Email', 'Phone', 'Company', 
            'Designation', 'Ticket Type', 'Registration Source', 
            'Checked In', 'Checked In At', 'Registration Date'
        ];

        $sheet->fromArray($headers, null, 'A1');

        // Data
        $rowIndex = 2;
        foreach ($attendees as $attendee) {
            $sheet->fromArray([
                $attendee->registration_id,
                $attendee->name,
                $attendee->email,
                $attendee->phone,
                $attendee->company,
                $attendee->designation,
                $attendee->ticket_type,
                $attendee->registration_source,
                $attendee->is_checked_in ? 'Yes' : 'No',
                $attendee->checked_in_at ? $attendee->checked_in_at->format('Y-m-d H:i:s') : '',
                $attendee->created_at->format('Y-m-d H:i:s'),
            ], null, 'A' . $rowIndex);
            $rowIndex++;
        }

        $fileName = $event->slug . '-attendees-' . now()->format('Y-m-d');

        if ($format === 'xlsx') {
            $writer = new Xlsx($spreadsheet);
            $fileName .= '.xlsx';
            $contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else {
            $writer = new Csv($spreadsheet);
            $fileName .= '.csv';
            $contentType = 'text/csv';
        }

        $tempFile = tempnam(sys_get_temp_dir(), 'export');
        $writer->save($tempFile);

        return response()->download($tempFile, $fileName, [
            'Content-Type' => $contentType,
        ])->deleteFileAfterSend();
    }
}
