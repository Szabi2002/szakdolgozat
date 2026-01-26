<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Ticket Purchase &amp; Digital Pass</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&amp;family=Noto+Sans:wght@300..800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#00a887",
                        "background-light": "#fafafa",
                        "background-dark": "#1a1d23",
                        "surface-light": "#ffffff",
                        "surface-dark": "#252a33",
                    },
                    fontFamily: {
                        "display": ["Lexend", "sans-serif"],
                        "body": ["Noto Sans", "sans-serif"]
                    },
                    borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "2xl": "1rem", "full": "9999px"},
                },
            },
        }
    </script>
<style>
        .ticket-perforation {
            background-image: radial-gradient(circle at 0px center, transparent 8px, #ffffff 8px), radial-gradient(circle at 100% center, transparent 8px, #ffffff 8px);
            background-position: 0 0, 0 0;
            background-size: 50% 100%;
            background-repeat: no-repeat;
        }
        .dark .ticket-perforation {
            background-image: radial-gradient(circle at 0px center, transparent 8px, #252a33 8px), radial-gradient(circle at 100% center, transparent 8px, #252a33 8px);
        }
        /* Custom scrollbar for cleaner look */
        ::-webkit-scrollbar {
            width: 8px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: #dae7e4;
            border-radius: 4px;
        }
        .dark ::-webkit-scrollbar-thumb {
            background: #374151;
        }
    </style>
</head>
<body class="bg-background-light dark:bg-background-dark text-[#101817] dark:text-gray-100 font-display transition-colors duration-200">
<!-- Header -->
<header class="sticky top-0 z-50 w-full border-b border-[#f0f5f4] dark:border-gray-800 bg-surface-light/95 dark:bg-background-dark/95 backdrop-blur-sm px-6 py-4">
<div class="max-w-7xl mx-auto flex items-center justify-between">
<div class="flex items-center gap-3">
<a class="flex items-center justify-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" href="#">
<span class="material-symbols-outlined text-[#101817] dark:text-white">arrow_back</span>
</a>
<div class="flex items-center gap-2">
<div class="size-5 text-primary">
<svg fill="currentColor" viewbox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
<path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z"></path>
</svg>
</div>
<span class="text-xl font-bold tracking-tight">CityTransit</span>
</div>
</div>
<!-- Steps Progress -->
<div class="hidden md:flex items-center gap-4 text-sm font-medium">
<div class="flex items-center gap-2 text-primary">
<div class="size-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">1</div>
<span>Select</span>
</div>
<div class="w-8 h-px bg-gray-200 dark:bg-gray-700"></div>
<div class="flex items-center gap-2 text-[#101817] dark:text-white">
<div class="size-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">2</div>
<span>Payment</span>
</div>
<div class="w-8 h-px bg-gray-200 dark:bg-gray-700"></div>
<div class="flex items-center gap-2 text-gray-400">
<div class="size-6 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-xs">3</div>
<span>Confirm</span>
</div>
</div>
<div class="flex items-center gap-4">
<button class="hidden sm:block text-sm font-medium hover:text-primary transition-colors">Help</button>
<div class="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 border border-gray-200 dark:border-gray-700" data-alt="User profile picture placeholder with abstract gradient" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuANIC5Kw-Xk_V9Eq_2EmO7UN0f17TBp8GhZoLCMq6eJPDmFy1orrhdLFis3YU-6Rk7jcIVdpys45X8BN30qmmJp-xGN-KD3PQKpuGVugpXv3pqf42So-hts9oPsaDhciD-_B1WQ0D9uGEz6EzVlvpWhHNtCInZpGkK6XDlPDilW_Ri9Zn27rDW8gasEeSaKHAjv5pcjunbzStvCbM1oLNO56OWAovnUUjJK-WiBWcLQeM_W0Spbp276q0rwn2xc6J1unsuTAscpiIGK");'></div>
</div>
</div>
</header>
<!-- Main Content -->
<main class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative">
<!-- Left Column: Interaction Flow -->
<div class="lg:col-span-7 flex flex-col gap-8">
<!-- Section Header -->
<div>
<h1 class="text-3xl font-bold tracking-tight text-[#101817] dark:text-white mb-2">Checkout</h1>
<p class="text-gray-500 dark:text-gray-400">Review your journey details and complete payment to generate your pass.</p>
</div>
<!-- Journey Summary Card -->
<div class="bg-surface-light dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
<h2 class="text-lg font-bold mb-6 flex items-center gap-2">
<span class="material-symbols-outlined text-primary">route</span>
                        Journey Summary
                    </h2>
<div class="grid grid-cols-[40px_1fr] gap-x-3 px-2">
<!-- Start Point -->
<div class="flex flex-col items-center pt-1">
<span class="material-symbols-outlined text-gray-400 text-[20px]">train</span>
<div class="w-0.5 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 h-full min-h-[40px] my-1"></div>
</div>
<div class="pb-6">
<div class="flex justify-between items-baseline">
<p class="text-base font-semibold">Central Station</p>
<p class="text-primary font-medium">10:00 AM</p>
</div>
<p class="text-sm text-gray-500 dark:text-gray-400">Platform 4 • Metro Line A</p>
</div>
<!-- End Point -->
<div class="flex flex-col items-center pb-1">
<div class="w-0.5 bg-gray-200 dark:bg-gray-700 h-2 mb-1"></div>
<span class="material-symbols-outlined text-gray-400 text-[20px]">location_on</span>
</div>
<div>
<div class="flex justify-between items-baseline">
<p class="text-base font-semibold">North Business Park</p>
<p class="text-gray-500 dark:text-gray-400">10:45 AM</p>
</div>
<p class="text-sm text-gray-500 dark:text-gray-400">Zone 2</p>
</div>
</div>
</div>
<!-- Ticket Type Selector -->
<div class="flex flex-col gap-4">
<h2 class="text-xl font-bold px-1">Select Ticket Type</h2>
<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
<!-- Option 1: Single -->
<label class="group relative flex flex-col p-5 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-surface-light dark:bg-surface-dark cursor-pointer transition-all hover:border-primary/50 hover:shadow-md">
<input class="peer sr-only" name="ticket_type" type="radio"/>
<div class="flex justify-between items-start mb-3">
<span class="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">confirmation_number</span>
<div class="size-4 rounded-full border border-gray-300 dark:border-gray-600 peer-checked:border-primary peer-checked:bg-primary"></div>
</div>
<div class="mt-auto">
<p class="font-bold text-lg">$2.50</p>
<p class="text-sm font-medium text-gray-900 dark:text-white">Single Trip</p>
<p class="text-xs text-gray-500 mt-1">Valid for 2 hours</p>
</div>
<div class="absolute inset-0 border-2 border-transparent peer-checked:border-primary rounded-xl pointer-events-none"></div>
</label>
<!-- Option 2: Day Pass -->
<label class="group relative flex flex-col p-5 rounded-xl border-2 border-primary bg-primary/5 dark:bg-primary/10 cursor-pointer transition-all shadow-sm">
<input checked="" class="peer sr-only" name="ticket_type" type="radio"/>
<div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wide">Popular</div>
<div class="flex justify-between items-start mb-3">
<span class="material-symbols-outlined text-primary">calendar_view_day</span>
<div class="size-4 rounded-full border border-primary bg-primary flex items-center justify-center">
<div class="size-1.5 bg-white rounded-full"></div>
</div>
</div>
<div class="mt-auto">
<p class="font-bold text-lg text-primary">$6.00</p>
<p class="text-sm font-medium text-gray-900 dark:text-white">Day Pass</p>
<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Unlimited 24h travel</p>
</div>
<div class="absolute inset-0 border-2 border-primary rounded-xl pointer-events-none"></div>
</label>
<!-- Option 3: Monthly -->
<label class="group relative flex flex-col p-5 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-surface-light dark:bg-surface-dark cursor-pointer transition-all hover:border-primary/50 hover:shadow-md">
<input class="peer sr-only" name="ticket_type" type="radio"/>
<div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F7C04A] text-black text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wide">Best Value</div>
<div class="flex justify-between items-start mb-3">
<span class="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">calendar_month</span>
<div class="size-4 rounded-full border border-gray-300 dark:border-gray-600"></div>
</div>
<div class="mt-auto">
<p class="font-bold text-lg">$45.00</p>
<p class="text-sm font-medium text-gray-900 dark:text-white">Monthly</p>
<p class="text-xs text-gray-500 mt-1">Unlimited 30d travel</p>
</div>
<div class="absolute inset-0 border-2 border-transparent peer-checked:border-primary rounded-xl pointer-events-none"></div>
</label>
</div>
</div>
<!-- Payment Details -->
<div class="bg-surface-light dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-6">
<h2 class="text-lg font-bold">Payment Details</h2>
<div class="flex flex-col gap-4">
<div class="flex flex-col gap-1">
<label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Card Number</label>
<div class="relative">
<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">credit_card</span>
<input class="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 dark:bg-background-dark border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary dark:text-white placeholder-gray-400 transition-shadow" placeholder="0000 0000 0000 0000" type="text"/>
</div>
</div>
<div class="grid grid-cols-2 gap-4">
<div class="flex flex-col gap-1">
<label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Expiry Date</label>
<input class="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-background-dark border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary dark:text-white placeholder-gray-400 transition-shadow" placeholder="MM / YY" type="text"/>
</div>
<div class="flex flex-col gap-1">
<label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">CVC</label>
<div class="relative">
<span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg cursor-help">help</span>
<input class="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-background-dark border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary dark:text-white placeholder-gray-400 transition-shadow" placeholder="123" type="text"/>
</div>
</div>
</div>
<div class="flex flex-col gap-1">
<label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cardholder Name</label>
<input class="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-background-dark border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary dark:text-white placeholder-gray-400 transition-shadow" placeholder="Full Name on Card" type="text"/>
</div>
</div>
</div>
<!-- Final CTA -->
<button class="w-full bg-primary hover:bg-teal-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all hover:translate-y-[-2px] flex items-center justify-between px-6 group">
<span class="text-lg">Pay &amp; Generate Pass</span>
<div class="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-lg">
<span class="text-sm font-normal">Total:</span>
<span class="text-lg">$6.00</span>
<span class="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
</div>
</button>
</div>
<!-- Right Column: Sticky Pass Preview -->
<div class="lg:col-span-5 relative">
<div class="sticky top-24 flex flex-col gap-6">
<div class="flex items-center justify-between px-1">
<h2 class="text-sm uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">Digital Pass Preview</h2>
<span class="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold px-2 py-1 rounded">DRAFT</span>
</div>
<!-- The Digital Ticket Card -->
<div class="relative bg-surface-light dark:bg-surface-dark rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-black/50 overflow-hidden border border-gray-100 dark:border-gray-700">
<!-- Top Half: Branding & Details -->
<div class="bg-primary p-6 text-white relative overflow-hidden">
<!-- Abstract Pattern Background -->
<div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(#ffffff 2px, transparent 2px); background-size: 20px 20px;"></div>
<div class="relative z-10 flex justify-between items-start mb-6">
<div class="flex flex-col">
<span class="font-bold text-xl tracking-tight">Metro Pass</span>
<span class="text-teal-100 text-sm">Zone 1-2 • Day Traveller</span>
</div>
<div class="size-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
<span class="material-symbols-outlined text-white">directions_subway</span>
</div>
</div>
<div class="relative z-10 flex flex-col gap-4">
<div class="flex justify-between items-center">
<div class="flex flex-col">
<span class="text-teal-100 text-xs uppercase font-medium">Valid From</span>
<span class="font-bold text-lg">10:00 AM</span>
<span class="text-sm text-teal-100">Today</span>
</div>
<span class="material-symbols-outlined text-white/50">arrow_forward</span>
<div class="flex flex-col items-end">
<span class="text-teal-100 text-xs uppercase font-medium">Valid Until</span>
<span class="font-bold text-lg">10:00 AM</span>
<span class="text-sm text-teal-100">Tomorrow</span>
</div>
</div>
</div>
</div>
<!-- Perforation visual trick -->
<div class="relative h-8 bg-surface-light dark:bg-surface-dark -mt-4 flex items-center justify-center">
<div class="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-8 bg-background-light dark:bg-background-dark rounded-r-full"></div>
<div class="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-8 bg-background-light dark:bg-background-dark rounded-l-full"></div>
<div class="w-[80%] border-b-2 border-dashed border-gray-200 dark:border-gray-700"></div>
</div>
<!-- Bottom Half: QR & Validation -->
<div class="p-6 pt-2 flex flex-col items-center gap-6">
<div class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
<img alt="High contrast QR code for ticket scanning" class="size-40 mix-blend-multiply opacity-90" data-alt="QR Code for ticket validation" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA764nKxwYD3s-D6cUsHSR9zV0cBWtZSz2CRRMpEIhuY7YMp-I1tSERSbjJagjQSwfbX8KQzvyM09dOrkZeJQcBfLe2F7_S1FO8wHfn5tywLuyf372P58denC3g6UDVkvtZxWhCTH8R5PRwWQF0dxdL6a4wdTix_KLJt7X_MraosaxNc--2Za4MH_5kXHtv0Y-Z-PH50sKC95ciUZ8SlOV4PkjLXpshauerjxRBSK8sblRhGc0Zv3dL4pfLfNLZP4JGzf-xfp7UUcfR"/>
</div>
<div class="w-full text-center space-y-2">
<div class="inline-flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
<span class="size-2 rounded-full bg-green-500 animate-pulse"></span>
                                    Active Preview
                                </div>
<p class="text-xs text-gray-400 dark:text-gray-500 max-w-[200px] mx-auto leading-relaxed">
                                    Scan this code at the turnstile gate to enter. Keep screen brightness high.
                                </p>
</div>
<div class="w-full pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between text-xs text-gray-400">
<span>Ticket #8392-AX</span>
<span>Ref: PREVIEW</span>
</div>
</div>
</div>
<!-- Security / Trust Badges -->
<div class="flex justify-center gap-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
<div class="flex items-center gap-1 text-xs font-medium text-gray-500">
<span class="material-symbols-outlined text-sm">lock</span>
                            Secure Payment
                        </div>
<div class="flex items-center gap-1 text-xs font-medium text-gray-500">
<span class="material-symbols-outlined text-sm">verified</span>
                            Official Agent
                        </div>
</div>
</div>
</div>
</div>
</main>
<script>
        // Simple logic to demonstrate the sticky nature visually or interactivity if desired
        // Not adding JS logic as per instructions, but the structure supports it.
    </script>
</body></html>