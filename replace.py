import os

files = [
    r'd:\BhoomiSetuV3\Frontend\components\ai\bhoomi-ai-chatbot.tsx',
    r'd:\BhoomiSetuV3\Frontend\components\ui\bhoomi-emblem.tsx',
    r'd:\BhoomiSetuV3\Frontend\components\field\camera-capture.tsx',
    r'd:\BhoomiSetuV3\Frontend\components\advanced\parcel-digital-twin-viewer.tsx',
    r'd:\BhoomiSetuV3\Frontend\components\gati-shakti\gati-shakti-screener.tsx',
    r'd:\BhoomiSetuV3\Frontend\components\gazette\gazette-preview-modal.tsx',
    r'd:\BhoomiSetuV3\Frontend\components\gazette\gazette-publisher.tsx',
    r'd:\BhoomiSetuV3\Frontend\components\gis\geotagged-photo-viewer.tsx',
    r'd:\BhoomiSetuV3\Frontend\components\gis\gis-map-client.tsx',
    r'd:\BhoomiSetuV3\Frontend\components\gis\gis-map.tsx',
]

for filepath in files:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        orig = content
        
        content = content.replace('BHOOMISETU STATUTORY FIELD EVIDENCE', 'AAROHAN STATUTORY FIELD EVIDENCE')
        content = content.replace('BhoomiSetu AI Assistant', 'Aarohan AI Assistant')
        content = content.replace('BhoomiSetu AI Agent', 'Aarohan AI Agent')
        content = content.replace('BhoomiSetu AI', 'Aarohan AI')
        content = content.replace('भूमिसेतु AI', 'आरोहण AI')
        content = content.replace('भूमिसेतु', 'आरोहण')
        content = content.replace('BhoomiSetu_AI_Transcript', 'Aarohan_AI_Transcript')
        content = content.replace('BHOOMI-SEED-01', 'AAROHAN-SEED-01')
        content = content.replace('BhoomiSetu backend API', 'Aarohan backend API')
        content = content.replace('BHOOMI-BLR-01', 'AAROHAN-BLR-01')
        content = content.replace('helpdesk-bhoomi@gov.in', 'helpdesk-aarohan@gov.in')
        content = content.replace('bhoomi-setu.gov.in', 'aarohan.gov.in')
        content = content.replace('bhoomi2026', 'aarohan2026')
        content = content.replace('BHOOMI CADASTRAL', 'AAROHAN CADASTRAL')
        content = content.replace('BHOOMISETU CADASTRAL', 'AAROHAN CADASTRAL')
        
        content = content.replace('BhoomiSetu', 'Aarohan')
        content = content.replace('bhoomiSetu', 'aarohan')
        content = content.replace('bhoomi-setu', 'aarohan')
        content = content.replace('BHOOMISETU', 'AAROHAN')
        content = content.replace('BHOOMI SETU', 'AAROHAN')
        content = content.replace('Bhoomi Setu', 'Aarohan')
        content = content.replace('bhoomi_', 'aarohan_')
        content = content.replace('bhoomi-', 'aarohan-')
        
        if 'camera-capture.tsx' in filepath:
            content = content.replace('\"BHOOMI\"', '\"AAROHAN\"')
            
        if 'geotagged-photo-viewer.tsx' in filepath:
            content = content.replace('& Bhoomi', '& Aarohan')
            
        if 'gis-map.tsx' in filepath:
            content = content.replace('BhoomiSetu Spatial GIS Engine', 'Aarohan Spatial GIS Engine')
            content = content.replace('Initializing Bhoomi Spatial GIS Engine...', 'Initializing Aarohan Spatial GIS Engine...')

        if content != orig:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print('Updated ' + filepath)
    except Exception as e:
        print('Error on ' + filepath + ': ' + str(e))
