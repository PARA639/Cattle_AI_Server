// ==================================================
// CATTLEAI - DUAL ENCLOSURE DESIGN
// Units: millimeters
// ==================================================

// SELECT PART:
// "power_box"
// "power_lid"
// "sensor_box"
// "sensor_lid"

part = "sensor_box";

$fn = 48;

// ==================================================
// GENERAL PARAMETERS
// ==================================================

wall = 2.5;
floor_thickness = 2.5;

lid_thickness = 3;

corner_radius = 5;

strap_width = 31;
strap_slot_width = strap_width + 2;
strap_slot_height = 4.5;

cable_diameter = 6;

// Power box
power_length = 90;
power_width = 60;
power_height = 30;

// Sensor box
sensor_length = 100;
sensor_width = 65;
sensor_height = 35;

// PCB
pcb_length = 76;
pcb_width = 51;

pcb_support_height = 5;


// ==================================================
// ROUNDED RECTANGULAR PRISM
// ==================================================

module rounded_box(l, w, h, r) {

    hull() {

        for (x = [r, l-r])
        for (y = [r, w-r]) {

            translate([x, y, 0])
                cylinder(
                    h = h,
                    r = r
                );

        }

    }

}


// ==================================================
// STRAP MOUNTING LOOPS
// External loops below the enclosure.
// ==================================================

module strap_mounts(l, w) {

    strap_gap = strap_slot_height;

    loop_thickness = 3;

    for (x = [15, l-15]) {

        translate([
            x - 5,
            (w-strap_slot_width)/2,
            -7
        ])

        difference() {

            cube([
                10,
                strap_slot_width + 6,
                7
            ]);

            translate([
                -1,
                3,
                2
            ])

            cube([
                12,
                strap_slot_width,
                strap_gap
            ]);

        }

    }

}


// ==================================================
// MAIN BOX SHELL
// ==================================================

module enclosure_shell(l, w, h) {

    difference() {

        union() {

            rounded_box(
                l,
                w,
                h,
                corner_radius
            );

            strap_mounts(
                l,
                w
            );

        }

        // Main internal cavity.
        // Open at the top.

        translate([
            wall,
            wall,
            floor_thickness
        ])

        rounded_box(
            l - 2*wall,
            w - 2*wall,
            h,
            corner_radius - wall
        );

        // Side cable opening.

        translate([
            l/2,
            -1,
            h/2
        ])

        rotate([
            90,
            0,
            0
        ])

        cylinder(
            h = wall + 3,
            d = cable_diameter
        );

    }

}


// ==================================================
// PCB SUPPORT RAILS
// Sensor box only.
// ==================================================

module pcb_supports() {

    x0 = (sensor_length-pcb_length)/2;
    y0 = (sensor_width-pcb_width)/2;

    rail_width = 3;

    translate([
        x0,
        y0,
        floor_thickness
    ])

    cube([
        pcb_length,
        rail_width,
        pcb_support_height
    ]);

    translate([
        x0,
        y0 + pcb_width - rail_width,
        floor_thickness
    ])

    cube([
        pcb_length,
        rail_width,
        pcb_support_height
    ]);

}


// ==================================================
// LID
// ==================================================

module enclosure_lid(l, w) {

    // Flat cover with internal alignment lip.

    union() {

        rounded_box(
            l,
            w,
            lid_thickness,
            corner_radius
        );

        translate([
            wall + 0.3,
            wall + 0.3,
            -2
        ])

        difference() {

            rounded_box(
                l - 2*wall - 0.6,
                w - 2*wall - 0.6,
                2,
                corner_radius - wall
            );

            translate([
                2,
                2,
                -1
            ])

            rounded_box(
                l - 2*wall - 4.6,
                w - 2*wall - 4.6,
                4,
                corner_radius - wall - 1
            );

        }

    }

}


// ==================================================
// POWER BOX
// ==================================================

module power_box() {

    enclosure_shell(
        power_length,
        power_width,
        power_height
    );

}


// ==================================================
// SENSOR BOX
// ==================================================

module sensor_box() {

    union() {

        enclosure_shell(
            sensor_length,
            sensor_width,
            sensor_height
        );

        pcb_supports();

    }

}


// ==================================================
// SELECT OUTPUT
// ==================================================

if (part == "power_box") {

    power_box();

}

if (part == "power_lid") {

    enclosure_lid(
        power_length,
        power_width
    );

}

if (part == "sensor_box") {

    sensor_box();

}

if (part == "sensor_lid") {

    enclosure_lid(
        sensor_length,
        sensor_width
    );

}
