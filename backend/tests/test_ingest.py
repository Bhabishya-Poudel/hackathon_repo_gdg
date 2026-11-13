from grantfinder import db
from grantfinder.ingest.grants_gov import parse_opportunity
from grantfinder.models import Grant

HIT = {"id": "1", "number": "X-1", "title": "Nursery &amp; Garden Fund", "agency": "USDA",
       "oppStatus": "posted", "closeDate": "12/31/2026"}
DETAIL = {"topAgencyDetails": {"agencyName": "Department of Agriculture"},
          "synopsis": {"synopsisDesc": "<p>Pots &amp; soil</p>", "awardCeiling": "5000",
                       "awardFloor": "0", "responseDate": "Oct 31, 2026 12:00:00 AM EDT",
                       "applicantTypes": [{"description": "Small businesses"}]}}


def test_parse_opportunity():
    g = parse_opportunity(HIT, DETAIL)
    assert g.id == "grants.gov:1"
    assert g.title == "Nursery & Garden Fund"
    assert g.description == "Pots & soil"
    assert (g.amount_min, g.amount_max, g.deadline) == (0, 5000, "2026-10-31")
    assert "Small businesses" in g.eligibility


def test_upsert_new_updated_unchanged(tmp_path):
    conn = db.connect(tmp_path / "t.db")
    g = Grant(source="seed", external_id="a", title="A", url="u")
    assert db.upsert_grants(conn, [g])["new"] == 1
    assert db.upsert_grants(conn, [g])["unchanged"] == 1
    g.description = "changed"
    assert db.upsert_grants(conn, [g])["updated"] == 1
    assert conn.execute("SELECT COUNT(*) FROM grants").fetchone()[0] == 1


def test_bulk_parse_record():
    import xml.etree.ElementTree as ET
    from grantfinder.ingest.grants_gov_bulk import parse_record
    xml = """<OpportunitySynopsisDetail_1_0 xmlns="x"><OpportunityID>9</OpportunityID>
    <OpportunityTitle>Small Biz</OpportunityTitle><EligibleApplicants>23 21</EligibleApplicants>
    <CloseDate>12312026</CloseDate><ArchiveDate>01012027</ArchiveDate><AwardCeiling>5000</AwardCeiling>
    <Description>A &amp;lt;b&amp;gt;grant&amp;lt;/b&amp;gt;</Description></OpportunitySynopsisDetail_1_0>"""
    g = parse_record(ET.fromstring(xml), "2026-10-18")
    assert (g.id, g.status, g.deadline, g.amount_max) == ("grants.gov:9", "open", "2026-12-31", 5000)
    assert g.description == "A grant" and "Small businesses" in g.eligibility
    assert parse_record(ET.fromstring(xml), "2027-02-01") is None  # archived
