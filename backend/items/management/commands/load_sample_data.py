from django.core.management.base import BaseCommand

from items.models import Item

SAMPLE_ITEMS = [
    dict(
        item_name="Black Dell Laptop",
        category="Electronics",
        status="Lost",
        location="Computer Science Lab, Block C",
        date="2026-09-01",
        description="14-inch Dell Inspiron with a college sticker on the lid. Has a cracked corner on the case.",
        contact_name="Arjun Kumar",
        contact_email="arjun.kumar@college.edu",
    ),
    dict(
        item_name="Blue Water Bottle",
        category="Other",
        status="Found",
        location="Library, 2nd floor near reading room",
        date="2026-09-03",
        description="Steel Milton bottle, blue with a dent on the base.",
        contact_name="Priya Raj",
        contact_email="priya.raj@college.edu",
    ),
    dict(
        item_name="Student ID Card - Madhumitha S",
        category="ID Cards",
        status="Found",
        location="Canteen, near the counter",
        date="2026-09-05",
        description="Found lying near table 4 during lunch hours.",
        contact_name="Security Office",
        contact_email="security@college.edu",
    ),
    dict(
        item_name="Wired Earphones (white)",
        category="Electronics",
        status="Lost",
        location="Auditorium, back row",
        date="2026-09-06",
        description="Apple-style white wired earphones in a small pouch.",
        contact_name="Kavya S",
        contact_email="kavya.s@college.edu",
    ),
    dict(
        item_name="Grey Backpack",
        category="Bags",
        status="Lost",
        location="Sports Ground",
        date="2026-09-07",
        description="Wildcraft grey backpack with a laptop sleeve, contains a notebook.",
        contact_name="Rahul Dev",
        contact_email="rahul.dev@college.edu",
    ),
    dict(
        item_name="Set of Bike Keys",
        category="Keys",
        status="Found",
        location="Parking Lot, Gate 2",
        date="2026-09-08",
        description="Two keys on a red keychain shaped like a helmet.",
        contact_name="Security Office",
        contact_email="security@college.edu",
    ),
    dict(
        item_name="Casio Scientific Calculator",
        category="Electronics",
        status="Found",
        location="Exam Hall 3",
        date="2026-09-09",
        description="fx-991ES Plus, name tag partially peeled off.",
        contact_name="Exam Cell",
        contact_email="examcell@college.edu",
    ),
    dict(
        item_name="Silver Wrist Watch",
        category="Accessories",
        status="Lost",
        location="Chemistry Lab",
        date="2026-09-10",
        description="Titan silver strap watch, round dial.",
        contact_name="Divya M",
        contact_email="divya.m@college.edu",
    ),
    dict(
        item_name="Data Structures Textbook",
        category="Books & Stationery",
        status="Found",
        location="Reading Hall, Table 12",
        date="2026-09-11",
        description="Textbook with name 'Sanjay' written on the first page.",
        contact_name="Library Desk",
        contact_email="library@college.edu",
    ),
    dict(
        item_name="Aadhaar Card & Bus Pass",
        category="Documents",
        status="Found",
        location="Main Gate Security Cabin",
        date="2026-09-12",
        description="Found together in a small transparent pouch.",
        contact_name="Security Office",
        contact_email="security@college.edu",
    ),
    dict(
        item_name="Maroon Hoodie",
        category="Clothing",
        status="Lost",
        location="Basketball Court",
        date="2026-09-13",
        description="College fest hoodie, maroon with white print on the back.",
        contact_name="Vikram T",
        contact_email="vikram.t@college.edu",
    ),
    dict(
        item_name="Wireless Mouse",
        category="Electronics",
        status="Lost",
        location="AIDS Department Seminar Hall",
        date="2026-09-14",
        description="Logitech black wireless mouse, USB receiver missing.",
        contact_name="Madhumitha S",
        contact_email="madhumitha.s@college.edu",
    ),
]


class Command(BaseCommand):
    help = "Load sample lost & found items into the database for testing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete existing items before loading sample data.",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            deleted, _ = Item.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Cleared {deleted} existing item(s)."))

        created = 0
        for entry in SAMPLE_ITEMS:
            _, was_created = Item.objects.get_or_create(
                item_name=entry["item_name"], date=entry["date"], defaults=entry
            )
            if was_created:
                created += 1

        self.stdout.write(self.style.SUCCESS(f"Loaded {created} sample item(s) (skipped duplicates)."))
