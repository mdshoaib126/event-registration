<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\Event;
use App\Models\Attendee;
use App\Services\QrCodeService;
use PhpOffice\PhpSpreadsheet\IOFactory;

class AttendeeController extends Controller
{
    protected $qrCodeService;

    public function __construct(QrCodeService $qrCodeService)
    {
        $this->qrCodeService = $qrCodeService;
    }

    /**
     * Display a listing of attendees for an event
     */
    public function index(Event $event, Request $request)
    {
        $query = $event->attendees()->with(['qrCode', 'checkedInBy']);

        // Filter by check-in status
        if ($request->has('checked_in')) {
            $query->where('is_checked_in', $request->boolean('checked_in'));
        }

        // Search by name, email, or phone
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $attendees = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($attendees);
    }

    /**
     * Public registration for events
     */
    public function register(Request $request, $slug)
    {
        $event = Event::where('slug', $slug)
            ->where('status', 'published')
            ->where('is_active', true)
            ->firstOrFail();

        // Check if event is full
        if ($event->isFull()) {
            return response()->json(['error' => 'Event is full'], 422);
        }

        // Build validation rules based on event configuration
        $rules = [];
        
        // Add rules for default fields
        if ($event->default_fields) {
            foreach ($event->default_fields as $fieldName => $fieldConfig) {
                $rule = $fieldConfig['required'] ? 'required' : 'nullable';
                
                switch ($fieldName) {
                    case 'name':
                        $rules['name'] = $rule . '|string|max:255';
                        break;
                    case 'email':
                        $rules['email'] = $rule . '|email|unique:attendees,email,NULL,id,event_id,' . $event->id;
                        break;
                    case 'phone':
                        $rules['phone'] = $rule . '|string|max:20';
                        break;
                }
            }
        } else {
            // Fallback to default rules if no default_fields configured
            $rules = [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:attendees,email,NULL,id,event_id,' . $event->id,
                'phone' => 'nullable|string|max:20',
            ];
        }

        // Add validation for custom fields
        if ($event->custom_fields) {
            foreach ($event->custom_fields as $field) {
                if ($field['required'] ?? false) {
                    $rules[$field['name']] = 'required';
                }
            }
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $data = $validator->validated();
        $data['event_id'] = $event->id;
        $data['registration_source'] = 'web';
        
        // Handle custom fields
        if ($event->custom_fields) {
            $customData = [];
            foreach ($event->custom_fields as $field) {
                if ($request->has($field['name'])) {
                    $customData[$field['name']] = $request->input($field['name']);
                }
            }
            $data['custom_data'] = $customData;
        }

        $attendee = Attendee::create($data);

        // Generate QR code
        $qrCode = $this->qrCodeService->generateQrCode($attendee);

        // Send confirmation email (implement as needed)
        // Mail::to($attendee->email)->send(new RegistrationConfirmation($attendee, $qrCode));

        return response()->json([
            'message' => 'Registration successful',
            'attendee' => $attendee->load('qrCode'),
            'qr_code_url' => url('storage/' . $qrCode->qr_code_image_path)
        ], 201);
    }

    /**
     * Store a newly created attendee (admin only)
     */
    public function store(Request $request, Event $event)
    {
        // Check if event is full
        if ($event->isFull()) {
            return response()->json(['error' => 'Event is full'], 422);
        }

        // Build validation rules based on event configuration
        $rules = [];
        
        // Add rules for default fields
        if ($event->default_fields) {
            foreach ($event->default_fields as $fieldName => $fieldConfig) {
                $rule = $fieldConfig['required'] ? 'required' : 'nullable';
                
                switch ($fieldName) {
                    case 'name':
                        $rules['name'] = $rule . '|string|max:255';
                        break;
                    case 'email':
                        $rules['email'] = $rule . '|email|unique:attendees,email,NULL,id,event_id,' . $event->id;
                        break;
                    case 'phone':
                        $rules['phone'] = $rule . '|string|max:20';
                        break;
                }
            }
        } else {
            // Fallback to default rules if no default_fields configured
            $rules = [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:attendees,email,NULL,id,event_id,' . $event->id,
                'phone' => 'nullable|string|max:20',
            ];
        }
        
        // Add custom data validation
        $rules['custom_data'] = 'nullable|array';

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $data = $validator->validated();
        $data['event_id'] = $event->id;
        $data['registration_source'] = 'admin';

        $attendee = Attendee::create($data);

        // Generate QR code
        $qrCode = $this->qrCodeService->generateQrCode($attendee);

        return response()->json([
            'message' => 'Attendee created successfully',
            'attendee' => $attendee->load('qrCode')
        ], 201);
    }

    /**
     * Display the specified attendee
     */
    public function show(Attendee $attendee)
    {
        return response()->json($attendee->load(['event', 'qrCode', 'checkedInBy']));
    }

    /**
     * Update the specified attendee
     */
    public function update(Request $request, Attendee $attendee)
    {
        $event = $attendee->event;
        
        // Build validation rules based on event configuration
        $rules = [];
        
        // Add rules for default fields
        if ($event->default_fields) {
            foreach ($event->default_fields as $fieldName => $fieldConfig) {
                $rule = $fieldConfig['required'] ? 'required' : 'nullable';
                
                switch ($fieldName) {
                    case 'name':
                        $rules['name'] = $rule . '|string|max:255';
                        break;
                    case 'email':
                        $rules['email'] = $rule . '|email|unique:attendees,email,' . $attendee->id . ',id,event_id,' . $attendee->event_id;
                        break;
                    case 'phone':
                        $rules['phone'] = $rule . '|string|max:20';
                        break;
                }
            }
        } else {
            // Fallback to default rules if no default_fields configured
            $rules = [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:attendees,email,' . $attendee->id . ',id,event_id,' . $attendee->event_id,
                'phone' => 'nullable|string|max:20',
            ];
        }
        
        // Add custom data validation
        $rules['custom_data'] = 'nullable|array';

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $attendee->update($validator->validated());

        return response()->json([
            'message' => 'Attendee updated successfully',
            'attendee' => $attendee->load('qrCode')
        ]);
    }

    /**
     * Remove the specified attendee
     */
    public function destroy(Attendee $attendee)
    {
        // Delete QR code file
        if ($attendee->qrCode && Storage::disk('public')->exists($attendee->qrCode->qr_code_image_path)) {
            Storage::disk('public')->delete($attendee->qrCode->qr_code_image_path);
        }

        $attendee->delete();

        return response()->json(['message' => 'Attendee deleted successfully']);
    }

    /**
     * Check in attendee
     */
    public function checkIn(Request $request, Attendee $attendee)
    {
        if ($attendee->is_checked_in) {
            return response()->json(['error' => 'Attendee already checked in'], 422);
        }

        $attendee->checkIn(auth()->id());

        return response()->json([
            'message' => 'Attendee checked in successfully',
            'attendee' => $attendee->load(['event', 'checkedInBy'])
        ]);
    }

    /**
     * Bulk import attendees from CSV/Excel
     */
    public function bulkImport(Request $request, Event $event)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:csv,xlsx,xls|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        try {
            $spreadsheet = IOFactory::load($request->file('file')->getPathname());
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            // Assume first row is headers
            $headers = array_shift($rows);
            $imported = 0;
            $errors = [];

            foreach ($rows as $index => $row) {
                $data = array_combine($headers, $row);
                
                // Skip empty rows
                if (empty(array_filter($data))) {
                    continue;
                }

                // Validate required fields
                if (empty($data['name']) || empty($data['email'])) {
                    $errors[] = "Row " . ($index + 2) . ": Name and email are required";
                    continue;
                }

                // Check for duplicate email in event
                if (Attendee::where('event_id', $event->id)->where('email', $data['email'])->exists()) {
                    $errors[] = "Row " . ($index + 2) . ": Email already exists for this event";
                    continue;
                }

                // Create attendee
                $attendee = Attendee::create([
                    'event_id' => $event->id,
                    'name' => $data['name'] ?? '',
                    'email' => $data['email'] ?? '',
                    'phone' => $data['phone'] ?? null,
                    'registration_source' => 'import',
                ]);

                // Generate QR code
                $this->qrCodeService->generateQrCode($attendee);
                $imported++;
            }

            return response()->json([
                'message' => "Successfully imported {$imported} attendees",
                'imported' => $imported,
                'errors' => $errors
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to process file: ' . $e->getMessage()], 422);
        }
    }

    /**
     * Export attendees as CSV
     */
    /**
     * Export attendees as CSV
     */
    public function export(Request $request)
    {
        try {
            // Get all attendees with their event and check-in information
            $attendees = Attendee::with(['event', 'checkedInBy', 'checkedOutBy'])
                ->orderBy('created_at', 'desc')
                ->get();

            // Generate CSV content
            $csvData = [];
            
            // CSV Headers
            $csvData[] = [
                'Registration ID',
                'Name',
                'Email', 
                'Phone',
                'Event',
                'Registration Date',
                'Check-in Status',
                'Check-in Date',
                'Checked-in By',
                'Check-out Date',
                'Checked-out By',
                'Registration Source'
            ];

            // Add attendee data rows
            foreach ($attendees as $attendee) {
                $csvData[] = [
                    $attendee->registration_id ?? '',
                    $attendee->name ?? '',
                    $attendee->email ?? '',
                    $attendee->phone ?? '',
                    $attendee->event->name ?? '',
                    $attendee->created_at ? $attendee->created_at->format('Y-m-d H:i:s') : '',
                    !$attendee->is_checked_in ? 'Not Checked In' : ($attendee->checked_out_at ? 'Checked Out' : 'Present'),
                    $attendee->checked_in_at ? $attendee->checked_in_at->format('Y-m-d H:i:s') : '',
                    $attendee->checkedInBy->name ?? '',
                    $attendee->checked_out_at ? $attendee->checked_out_at->format('Y-m-d H:i:s') : '',
                    $attendee->checkedOutBy->name ?? '',
                    $attendee->registration_source ?? ''
                ];
            }

            // Convert to CSV string
            $output = fopen('php://temp', 'w');
            foreach ($csvData as $row) {
                fputcsv($output, $row);
            }
            rewind($output);
            $csvContent = stream_get_contents($output);
            fclose($output);

            $filename = 'attendees-export-' . date('Y-m-d') . '.csv';

            return response($csvContent)
                ->header('Content-Type', 'text/csv')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
                ->header('Cache-Control', 'must-revalidate, post-check=0, pre-check=0')
                ->header('Expires', '0')
                ->header('Pragma', 'public');

        } catch (\Exception $e) {
            return response()->json(['error' => 'Export failed: ' . $e->getMessage()], 500);
        }
    }



}
