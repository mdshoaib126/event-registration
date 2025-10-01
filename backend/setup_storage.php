<?php

// Create storage link manually
$target = __DIR__ . '/storage/app/public';
$link = __DIR__ . '/public/storage';

if (is_link($link)) {
    echo "Storage link already exists.\n";
} elseif (is_dir($link)) {
    echo "Storage directory exists but is not a symlink. Please remove it first.\n";
} else {
    if (symlink($target, $link)) {
        echo "Storage link created successfully.\n";
    } else {
        echo "Failed to create storage link.\n";
    }
}

// Check if the banner directory exists
$bannerDir = __DIR__ . '/storage/app/public/events/banners';
if (!is_dir($bannerDir)) {
    mkdir($bannerDir, 0755, true);
    echo "Created banners directory.\n";
}

// Check if logo directory exists
$logoDir = __DIR__ . '/storage/app/public/events/logos';
if (!is_dir($logoDir)) {
    mkdir($logoDir, 0755, true);
    echo "Created logos directory.\n";
}

echo "Storage setup completed.\n";