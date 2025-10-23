<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class StaffController extends Controller
{
    /**
     * Display a listing of staff members
     */
    public function index(Request $request)
    {
        $query = User::where('role', 'event_staff');

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $staff = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($staff);
    }

    /**
     * Store a newly created staff member
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $staff = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'event_staff',
        ]);

        return response()->json([
            'message' => 'Staff member created successfully',
            'staff' => $staff
        ], 201);
    }

    /**
     * Display the specified staff member
     */
    public function show(User $staff)
    {
        // Ensure the user is a staff member
        if ($staff->role !== 'event_staff') {
            return response()->json(['error' => 'Staff member not found'], 404);
        }

        return response()->json($staff);
    }

    /**
     * Update the specified staff member
     */
    public function update(Request $request, User $staff)
    {
        // Ensure the user is a staff member
        if ($staff->role !== 'event_staff') {
            return response()->json(['error' => 'Staff member not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $staff->id,
            'password' => 'nullable|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $updateData = [
            'name' => $request->name,
            'email' => $request->email,
        ];

        // Only update password if provided
        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $staff->update($updateData);

        return response()->json([
            'message' => 'Staff member updated successfully',
            'staff' => $staff->fresh()
        ]);
    }

    /**
     * Remove the specified staff member
     */
    public function destroy(User $staff)
    {
        // Ensure the user is a staff member
        if ($staff->role !== 'event_staff') {
            return response()->json(['error' => 'Staff member not found'], 404);
        }

        // Prevent deletion if staff has checked in attendees
        $checkedInCount = \App\Models\Attendee::where('checked_in_by', $staff->id)
            ->orWhere('checked_out_by', $staff->id)
            ->count();

        if ($checkedInCount > 0) {
            return response()->json([
                'error' => 'Cannot delete staff member who has check-in/check-out records. Please reassign their records first.'
            ], 422);
        }

        $staff->delete();

        return response()->json([
            'message' => 'Staff member deleted successfully'
        ]);
    }

    /**
     * Get staff statistics
     */
    public function stats()
    {
        $totalStaff = User::where('role', 'event_staff')->count();
        $activeStaff = User::where('role', 'event_staff')
            ->where('created_at', '>=', now()->subDays(30))
            ->count();

        return response()->json([
            'total_staff' => $totalStaff,
            'active_staff' => $activeStaff,
        ]);
    }
}
