import pdfplumber
import json
import re
import os

pdf_path = r"D:\cmf_muni\Center For Municipal Finance\US States - Muni Bonds Data.pdf"
out_path = r"D:\cmf_muni\Center For Municipal Finance\State_Muni_Bonds_Data.json"

def scrape():
    data = []
    print(f"Scanning {os.path.basename(pdf_path)}...")
    
    with pdfplumber.open(pdf_path) as pdf:
        records = []
        current_state = None
        page1_text = ""
        page2_text = ""
        
        def process_state():
            if not current_state: return
            
            record = {"State_Name": current_state}
            clean_text1 = page1_text.replace('\n', ' ')
            
            m_inv = re.search(r"invested\s+\$([\d.,]+)\s+(billion|million)", clean_text1)
            record["Total_Investment_Value"] = float(m_inv.group(1).replace(',', '')) if m_inv else None
            record["Total_Investment_Unit"] = m_inv.group(2) if m_inv else None
            
            m_sav = re.search(r"saved an estimated\s+\$([\d.,]+)\s+(million|billion)", clean_text1)
            record["Taxpayer_Savings_Value"] = float(m_sav.group(1).replace(',', '')) if m_sav else None
            record["Taxpayer_Savings_Unit"] = m_sav.group(2) if m_sav else None
            
            m_issuers = re.search(r"A total of ([\d,]+) state and local", clean_text1)
            record["Total_Issuers"] = int(m_issuers.group(1).replace(',', '')) if m_issuers else None
            
            m_small = re.search(r"Of them, ([\d,]+) have borrowed less than", clean_text1)
            if not m_small:
                m_small = re.search(r"([\d,]+) have borrowed less than", clean_text1)
            record["Small_Borrowers"] = int(m_small.group(1).replace(',', '')) if m_small else None
            
            m_pct = re.search(r"are\s+([\d.]+)%\s*of", clean_text1)
            record["Small_Borrowers_Pct"] = float(m_pct.group(1)) if m_pct else None
            
            # Page 2 parsing
            clean_text2 = page2_text.replace('\n', ' ')
            m_active = re.search(r"there are \$([\d.,]+) (billion|million) of active", clean_text2)
            record["Active_Bonds_Value"] = float(m_active.group(1).replace(',', '')) if m_active else None
            record["Active_Bonds_Unit"] = m_active.group(2) if m_active else None
            
            # Proceeds parsing
            proceeds = []
            lines2 = page2_text.strip().split('\n')
            for line in lines2:
                line = line.strip()
                m_line = re.search(r"^(.+?)\s+\$([\d.,]+)$", line)
                if m_line:
                    cat = m_line.group(1).strip()
                    if cat.lower() == 'total':
                        continue
                    amount = float(m_line.group(2).replace(',', ''))
                    proceeds.append({
                        "Category": cat,
                        "Amount_Millions": amount
                    })
            record["Proceeds_Data"] = proceeds
            data.append(record)

        for page in pdf.pages:
            text = page.extract_text()
            if not text: continue
            lines = text.strip().split('\n')
            
            if "Municipal Bonds in" in lines[0]:
                process_state()
                current_state = lines[0].replace("Municipal Bonds in ", "").strip()
                page1_text = text
                page2_text = ""
            elif "Tax-exempt municipal bonds finance" in lines[0]:
                page2_text += "\n" + text
            else:
                if not page2_text:
                    page1_text += "\n" + text
                else:
                    page2_text += "\n" + text
                    
        # Process last state
        process_state()

    with open(out_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Successfully scraped {len(data)} states.")
    print(f"Output saved to {out_path}")
    
    # Check for missing data
    missing = [d["State_Name"] for d in data if d["Total_Issuers"] is None]
    if missing:
        print(f"WARNING: Missing 'Total Issuers' for {len(missing)} states: {', '.join(missing)}")
    else:
        print("Data health check passed: No missing core metrics.")

if __name__ == '__main__':
    scrape()
