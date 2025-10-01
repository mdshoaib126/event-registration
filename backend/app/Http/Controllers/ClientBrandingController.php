<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use App\Models\ClientBranding;

class ClientBrandingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $brandings = ClientBranding::orderBy('created_at', 'desc')->paginate(10);
        return response()->json($brandings);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'company_name' => 'required|string|max:255',
            'company_description' => 'nullable|string',
            'primary_color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'secondary_color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'accent_color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'organizer_logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $data = $validator->validated();

        // Handle logo upload
        if ($request->hasFile('organizer_logo')) {
            $data['organizer_logo'] = $request->file('organizer_logo')->store('branding/logos', 'public');
        }

        // Deactivate all other brandings
        ClientBranding::where('is_active', true)->update(['is_active' => false]);

        // Create new branding as active
        $data['is_active'] = true;
        $branding = ClientBranding::create($data);

        return response()->json([
            'message' => 'Branding created successfully',
            'branding' => $branding
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(ClientBranding $clientBranding)
    {
        return response()->json($clientBranding);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ClientBranding $clientBranding)
    {
        $validator = Validator::make($request->all(), [
            'company_name' => 'required|string|max:255',
            'company_description' => 'nullable|string',
            'primary_color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'secondary_color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'accent_color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'organizer_logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $data = $validator->validated();

        // Handle logo upload
        if ($request->hasFile('organizer_logo')) {
            // Delete old logo
            if ($clientBranding->organizer_logo) {
                Storage::disk('public')->delete($clientBranding->organizer_logo);
            }
            $data['organizer_logo'] = $request->file('organizer_logo')->store('branding/logos', 'public');
        }

        $clientBranding->update($data);

        return response()->json([
            'message' => 'Branding updated successfully',
            'branding' => $clientBranding
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ClientBranding $clientBranding)
    {
        // Don't allow deletion of active branding
        if ($clientBranding->is_active) {
            return response()->json(['error' => 'Cannot delete active branding'], 422);
        }

        // Delete logo file
        if ($clientBranding->organizer_logo) {
            Storage::disk('public')->delete($clientBranding->organizer_logo);
        }

        $clientBranding->delete();

        return response()->json(['message' => 'Branding deleted successfully']);
    }

    /**
     * Activate branding configuration
     */
    public function activate(ClientBranding $clientBranding)
    {
        // Deactivate all other brandings
        ClientBranding::where('is_active', true)->update(['is_active' => false]);

        // Activate this branding
        $clientBranding->update(['is_active' => true]);

        return response()->json([
            'message' => 'Branding activated successfully',
            'branding' => $clientBranding
        ]);
    }

    /**
     * Get public branding information
     */
    public function getPublicBranding()
    {
        $branding = ClientBranding::getActive();

        return response()->json([
            'branding' => $branding,
            'logo_url' => $branding->organizer_logo ? url('storage/' . $branding->organizer_logo) : null
        ]);
    }
}
