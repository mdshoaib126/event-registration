'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { QrCode, Camera, CheckCircle, X, AlertTriangle } from 'lucide-react';
import attendeeService, { Attendee } from '@/lib/attendees';
import authService from '@/lib/auth';
import QrScanner from 'qr-scanner';

interface ScanResult {
  success: boolean;
  message: string;
  action?: 'check_in' | 'check_out' | 'already_checked_out';
  attendee?: Attendee;
  error?: string;
}

interface RecentScan {
  attendee: Attendee;
  scannedAt: string;
  action: 'check_in' | 'check_out' | 'already_checked_out';
}

export default function StaffPage() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [todayStats, setTodayStats] = useState({
    totalCheckIns: 0,
    totalCheckOuts: 0,
    currentlyPresent: 0
  });

  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    // Check if user is staff or admin
    const user = authService.getUser();
    if (!user || (user.role !== 'event_staff' && user.role !== 'admin')) {
      router.push('/auth/login');
      return;
    }
    

  }, [router]);

  // Calculate today's statistics from recent scans
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayScans = recentScans.filter(scan => {
      const scanDate = new Date(scan.scannedAt).toISOString().split('T')[0];
      return scanDate === today;
    });
    
    const checkIns = todayScans.filter(scan => scan.action === 'check_in').length;
    const checkOuts = todayScans.filter(scan => scan.action === 'check_out').length;
    
    setTodayStats({
      totalCheckIns: checkIns,
      totalCheckOuts: checkOuts,
      currentlyPresent: Math.max(0, checkIns - checkOuts)
    });
  }, [recentScans]);

  const startScanning = async () => {
    console.log('Start scanning clicked...');
    console.log('Camera available:', cameraAvailable);
    
    try {
      // Check if camera is available
      if (cameraAvailable === false) {
        console.log('Camera not available:', cameraError);
        setScanResult({
          success: false,
          message: cameraError || 'No camera available. Please use manual input.',
          error: 'No camera available'
        });
        return;
      }

      // Check if running on HTTPS or localhost for camera access
      const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      console.log('Is secure context:', isSecure, 'Protocol:', location.protocol, 'Hostname:', location.hostname);
      
      if (!isSecure) {
        setScanResult({
          success: false,
          message: 'Camera access requires HTTPS. Please use HTTPS or localhost.',
          error: 'Insecure context'
        });
        return;
      }

      // Set scanning to true first to render the video element
      setIsScanning(true);
      setScanResult(null);

      // Wait for the next tick to ensure video element is rendered
      setTimeout(async () => {
        console.log('Video ref after timeout:', videoRef.current);
        if (videoRef.current) {
          try {
            console.log('Creating QR scanner instance...');
            // Create QR scanner instance
            qrScannerRef.current = new QrScanner(
              videoRef.current,
              (result) => {
                console.log('QR code detected:', result.data);
                handleQrCodeDetected(result.data);
              },
              {
                onDecodeError: () => {
                  // Ignore decode errors (normal when no QR code is visible)
                },
                preferredCamera: 'environment', // Use rear camera if available
                highlightScanRegion: true,
                highlightCodeOutline: true,
              }
            );

            console.log('Starting QR scanner...');
            await qrScannerRef.current.start();
            console.log('QR scanner started successfully');
          } catch (scannerError: any) {
            console.error('Error initializing scanner:', scannerError);
            setIsScanning(false);
            
            let message = 'Unable to access camera. ';
            let errorType = 'Unknown error';
            
            if (scannerError.name === 'NotAllowedError') {
              message += 'Please grant camera permission and try again.';
              errorType = 'Permission denied';
            } else if (scannerError.name === 'NotFoundError') {
              message += 'No camera found on this device.';
              errorType = 'No camera available';
            } else if (scannerError.name === 'NotSupportedError') {
              message += 'Camera not supported on this device.';
              errorType = 'Camera not supported';
            } else if (scannerError.name === 'NotReadableError') {
              message += 'Camera is already in use by another application.';
              errorType = 'Camera busy';
            } else {
              message += 'Please check your camera settings and permissions.';
              errorType = scannerError.name || 'Camera access error';
            }
            
            setScanResult({
              success: false,
              message,
              error: errorType
            });
          }
        } else {
          console.log('Video ref is still null after timeout');
          setIsScanning(false);
          setScanResult({
            success: false,
            message: 'Unable to initialize camera view. Please try again.',
            error: 'Video element not available'
          });
        }
      }, 100);
    } catch (error: any) {
      console.error('Error in startScanning:', error);
      setIsScanning(false);
      setScanResult({
        success: false,
        message: 'Failed to start camera. Please try again.',
        error: error.message || 'Unknown error'
      });
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleQrCodeDetected = async (qrData: string) => {
    // Stop scanning temporarily to prevent multiple scans
    if (qrScannerRef.current) {
      qrScannerRef.current.pause();
    }

    try {
      setScanResult(null);
      const result = await attendeeService.scanQrCode(qrData);
      
      setScanResult({
        success: true,
        message: result.message,
        action: result.action,
        attendee: result.attendee
      });

      // Add to recent scans
      setRecentScans(prev => [{
        attendee: result.attendee,
        scannedAt: new Date().toISOString(),
        action: result.action || 'check_in'
      }, ...prev.slice(0, 9)]);
      
      // Statistics will be automatically updated via useEffect when recentScans changes
      
      // Resume scanning after 2 seconds
      setTimeout(() => {
        if (qrScannerRef.current && isScanning) {
          qrScannerRef.current.start();
        }
      }, 2000);
      
    } catch (error: any) {
      setScanResult({
        success: false,
        message: error.response?.data?.error || 'Failed to process QR code',
        error: error.response?.data?.error
      });
      
      // Resume scanning after 3 seconds on error
      setTimeout(() => {
        if (qrScannerRef.current && isScanning) {
          qrScannerRef.current.start();
        }
      }, 3000);
    }
  };



  useEffect(() => {
    // Check camera availability on mount
    checkCameraAvailability();
    
    return () => {
      // Cleanup on unmount
      stopScanning();
    };
  }, []);

  const checkCameraAvailability = async () => {
    console.log('Checking camera availability...');
    try {
      // Check if QR scanner can detect camera
      const hasCamera = await QrScanner.hasCamera();
      console.log('QR Scanner hasCamera result:', hasCamera);
      setCameraAvailable(hasCamera);
      
      if (!hasCamera) {
        console.log('No camera detected');
        setCameraError('No camera detected on this device. You can still use manual input for check-ins.');
        return;
      }

      // Additional check with getUserMedia for more detailed error info
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          // If successful, stop the test stream immediately
          stream.getTracks().forEach(track => track.stop());
          setCameraError(null);
        } catch (error: any) {
          setCameraAvailable(false);
          if (error.name === 'NotAllowedError') {
            setCameraError('Camera permission denied. Please enable camera access and refresh the page.');
          } else if (error.name === 'NotFoundError') {
            setCameraError('No camera found. You can use manual input for check-ins.');
          } else {
            setCameraError('Camera unavailable. Using manual input mode.');
          }
        }
      } else {
        setCameraAvailable(false);
        setCameraError('Camera not supported in this browser. Using manual input mode.');
      }
    } catch (error) {
      setCameraAvailable(false);
      setCameraError('Unable to detect camera. Using manual input mode.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-gray-600">Event check-in and attendee management</p>
        </div>

        {/* Staff Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-500">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Check-ins</p>
                <p className="text-2xl font-semibold text-gray-900">{todayStats.totalCheckIns}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-500">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Currently Present</p>
                <p className="text-2xl font-semibold text-gray-900">{todayStats.currentlyPresent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-500">
                <X className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Check-outs Today</p>
                <p className="text-2xl font-semibold text-gray-900">{todayStats.totalCheckOuts}</p>
              </div>
            </div>
          </div>
        </div>

        {/* QR Scanner Section */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">QR Code Check-in</h2>
        </div>

        {/* Scanner Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Camera/Scanner */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Scanner</h2>
              <div className="flex items-center gap-2">
                {cameraAvailable === false && (
                  <span className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    No Camera
                  </span>
                )}
                {!isScanning ? (
                  <button
                    onClick={(e) => {
                      console.log('Button clicked!', e);
                      startScanning();
                    }}
                    disabled={cameraAvailable === false}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </button>
                ) : (
                  <button
                    onClick={stopScanning}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Stop Camera
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              {isScanning ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg"
                  />
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-lg opacity-50">
                    <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-blue-500"></div>
                    <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-blue-500"></div>
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-blue-500"></div>
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-blue-500"></div>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center p-6">
                    <QrCode className="mx-auto h-12 w-12 text-gray-400" />
                    {cameraAvailable === false ? (
                      <div>
                        <p className="mt-2 text-sm text-amber-700 font-medium">
                          Camera Not Available
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {cameraError}
                        </p>
                        <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                          <p className="text-sm text-amber-800 font-medium">
                            � Camera Required
                          </p>
                          <p className="text-xs text-amber-600 mt-1">
                            Please enable camera access or use a device with camera support to scan QR codes
                          </p>
                        </div>
                      </div>
                    ) : cameraAvailable === null ? (
                      <div>
                        <p className="mt-2 text-sm text-gray-500">
                          Checking camera availability...
                        </p>
                        <div className="mt-2 animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mx-auto"></div>
                      </div>
                    ) : (
                      <div>
                        <p className="mt-2 text-sm text-gray-500">
                          Camera ready - Click "Start Camera" to begin scanning
                        </p>
                        <div className="mt-4 text-xs text-gray-400 space-y-1">
                          <p>• Make sure you're using HTTPS or localhost</p>
                          <p>• Grant camera permission when prompted</p>
                          <p>• Point camera at QR codes to scan</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>


          </div>

          {/* Scan Result */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Scan Result</h2>
            
            {scanResult ? (
              <div className={`p-4 rounded-lg ${
                scanResult.success 
                  ? scanResult.action === 'check_out' 
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex">
                  {scanResult.success ? (
                    <CheckCircle className={`h-5 w-5 ${
                      scanResult.action === 'check_out' ? 'text-blue-400' : 'text-green-400'
                    }`} />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  )}
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${
                      scanResult.success 
                        ? scanResult.action === 'check_out'
                          ? 'text-blue-800'
                          : 'text-green-800'
                        : 'text-red-800'
                    }`}>
                      {scanResult.success 
                        ? scanResult.action === 'check_in' 
                          ? 'Check-in Successful'
                          : scanResult.action === 'check_out'
                          ? 'Check-out Successful'
                          : 'Already Checked Out'
                        : 'Scan Failed'
                      }
                    </h3>
                    <p className={`mt-1 text-sm ${
                      scanResult.success 
                        ? scanResult.action === 'check_out'
                          ? 'text-blue-700'
                          : 'text-green-700'
                        : 'text-red-700'
                    }`}>
                      {scanResult.message}
                    </p>
                    
                    {scanResult.attendee && (
                      <div className="mt-3 text-sm text-gray-900 space-y-1">
                        <p><strong>Name:</strong> {scanResult.attendee.name}</p>
                        <p><strong>Email:</strong> {scanResult.attendee.email}</p>
                        {scanResult.attendee.phone && (
                          <p><strong>Phone:</strong> {scanResult.attendee.phone}</p>
                        )}
                        
                        {/* Display custom fields */}
                        {scanResult.attendee.custom_data && Object.keys(scanResult.attendee.custom_data).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="font-medium text-gray-700 mb-2">Additional Information:</p>
                            {Object.entries(scanResult.attendee.custom_data).map(([key, value]) => (
                              <p key={key}>
                                <strong>{key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}:</strong>{' '}
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <QrCode className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Scan a QR code to see attendee information
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {recentScans.map((scan, index) => {
                const getAttendanceStatus = () => {
                  if (!scan.attendee.is_checked_in) {
                    return { label: 'Not Checked In', color: 'gray', icon: X };
                  } else if (scan.attendee.is_checked_in && !scan.attendee.checked_out_at) {
                    return { label: 'Present', color: 'green', icon: CheckCircle };
                  } else {
                    return { label: 'Checked Out', color: 'blue', icon: CheckCircle };
                  }
                };
                
                const status = getAttendanceStatus();
                const StatusIcon = status.icon;
                
                return (
                  <div key={`${scan.attendee.id}-${index}-${scan.scannedAt}`} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{scan.attendee.name}</h3>
                        <p className="text-sm text-gray-500">{scan.attendee.email}</p>
                        {scan.attendee.phone && (
                          <p className="text-sm text-gray-500">{scan.attendee.phone}</p>
                        )}
                        
                        {/* Display custom fields in recent scans */}
                        {scan.attendee.custom_data && Object.keys(scan.attendee.custom_data).length > 0 && (
                          <div className="mt-2 text-xs text-gray-600 space-y-1">
                            {Object.entries(scan.attendee.custom_data).map(([key, value]) => (
                              <p key={key}>
                                <span className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}:</span>{' '}
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {scan.attendee.checked_in_at && new Date(scan.attendee.checked_in_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}