import { NextRequest, NextResponse } from 'next/server';
import { COMMON_ERROR_PATTERNS } from '@/lib/knowledge';
import { searchSystemKnowledge, getAllScreens, getAllPopErrors } from '@/lib/knowledge-hub';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body.message?.trim() || '';

    if (!message) {
      return NextResponse.json({ error: 'Nội dung tin nhắn không được để trống.' }, { status: 400 });
    }

    // Search all 5 L1 matrices for any screen, POP error, or DB match
    const searchHits = searchSystemKnowledge(message);

    // 1. Check if Gemini API key exists
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (apiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: message }] }],
              systemInstruction: {
                parts: [{
                  text: `Bạn là Trợ lý AI Vận Hành Cao Cấp của hệ thống Vinatech MES & POP (Author/ChangeUserID='vanduc').
Nhiệm vụ: Chẩn đoán sự cố sản xuất, Kiosk POP, Groupware, ERP 5 CSDL dựa trên ma trận 97 màn hình MES và 38 mã lỗi POP Kiosk.
QUY TẮC BẮT BUỘC: Mọi phân tích lỗi sự cố phải trả lời dứt khoát theo đúng chuẩn "4 Dòng Vàng":
1. 🎯 Nguyên nhân gốc rễ (Root Cause): Màn hình, SP, cơ chế lỗi.
2. 📍 Hiện trạng thực tế: Vị trí Lot, bảng kẹt.
3. 🛠️ Cách OP tự xử lý trên giao diện (Workaround): Bước 1-2-3 cho công nhân.
4. ⚡ SQL Hotfix chuẩn (Nếu IT can thiệp): Bọc BEGIN TRAN...ROLLBACK, ChangeUserID='vanduc'.
Tuyệt đối tuân thủ EA Playbook (Rule 20) và Rule 21 (không query dò dẫm, luôn dùng tool).`
                }]
              }
            })
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (replyText) {
            return NextResponse.json({
              reply: replyText,
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch {
        // Fallback to internal rules engine
      }
    }

    // 2. Intelligent Built-in Diagnostic Engine backed by 97 Screens & 38 POP Errors
    const lotMatch = message.match(/VV[A-Z0-9]{8,15}/i);
    const targetLot = lotMatch ? lotMatch[0].toUpperCase() : 'VVQR232R710618';
    const machineMatch = message.match(/VV[A-Z]{2,4}\d{2,4}/i);
    const targetMachine = machineMatch ? machineMatch[0].toUpperCase() : 'VVMHY130';

    // Check if matched a specific Screen ID (e.g. B530, B781, F330)
    const screenMatch = message.match(/[A-Z]\d{3}/i);
    let matchedScreen = screenMatch ? getAllScreens().find(s => s.id.toUpperCase() === screenMatch[0].toUpperCase()) : null;

    // Check if matched a specific POP Error Code (e.g. POP-ERR-09, POP-ERR-37)
    const popErrMatch = message.match(/POP-ERR-\d{2}/i);
    let matchedPopErr = popErrMatch ? getAllPopErrors().find(e => e.code.toUpperCase() === popErrMatch[0].toUpperCase()) : null;

    if (!matchedPopErr && searchHits?.popErrors?.length) {
      matchedPopErr = searchHits.popErrors[0];
    }
    if (!matchedScreen && searchHits?.screens?.length) {
      matchedScreen = searchHits.screens[0];
    }

    // Pattern matching from common error patterns
    const commonPattern = COMMON_ERROR_PATTERNS.find(p => p.pattern.test(message));

    if (matchedPopErr) {
      const hotfixSql = matchedPopErr.fast_fix.includes('DELETE') || matchedPopErr.fast_fix.includes('UPDATE')
        ? `-- Hotfix tu POP-ERR: ${matchedPopErr.code}\nBEGIN TRAN\n  ${matchedPopErr.fast_fix.replace(/<Lots>/g, targetLot)}\nROLLBACK TRAN;\n-- COMMIT TRAN;`
        : `-- Tra cuu & Khac phuc theo Rule 20\nBEGIN TRAN\n  UPDATE VINATECH_POP.dbo.MongoToMesPerformance SET MachineCode = '${targetMachine}' WHERE LotID = '${targetLot}';\nROLLBACK TRAN;\n-- COMMIT TRAN;`;

      const structured = {
        rootCause: `[${matchedPopErr.code}] ${matchedPopErr.title}: ${matchedPopErr.root_cause}`,
        currentStatus: `Đối tượng liên quan: ${targetLot}. Tra cứu từ Ma Trận L1 Cache POP_MATRIX (38 mã lỗi Kiosk).`,
        workaround: `OP thao tác theo hướng dẫn Kiosk: ${matchedPopErr.fast_fix.split('—')[0]}`,
        hotfixSql
      };

      const reply = `### 🎯 BÁO CÁO PHÂN TÍCH CHUẨN 4 DÒNG VÀNG (${matchedPopErr.code})

1. **🎯 Nguyên nhân gốc rễ (Root Cause):**
${structured.rootCause}

2. **📍 Hiện trạng thực tế:**
${structured.currentStatus}

3. **🛠️ Cách OP tự xử lý trên giao diện (Workaround):**
${structured.workaround}

4. **⚡ SQL Hotfix chuẩn (Đã bọc Transaction an toàn - Author: vanduc):**
\`\`\`sql
${structured.hotfixSql}
\`\`\``;

      return NextResponse.json({
        reply,
        structuredResponse: structured,
        quickActions: [
          { label: `Trace 360° ${targetLot}`, actionType: 'trace', payload: targetLot },
          { label: `Mở khóa máy ${targetMachine}`, actionType: 'unlock', payload: targetMachine },
          { label: 'Copy SQL Hotfix', actionType: 'copy_sql', payload: hotfixSql }
        ],
        timestamp: new Date().toISOString()
      });
    }

    if (matchedScreen) {
      const bugKeys = Object.keys(matchedScreen.common_bugs);
      const bugDesc = bugKeys.length > 0 ? matchedScreen.common_bugs[bugKeys[0]] : 'Lỗi phát sinh trong quá trình chốt dữ liệu công đoạn.';
      const hotfixSql = matchedScreen.fix_template || `-- Hotfix man hinh ${matchedScreen.id}\nBEGIN TRAN\n  UPDATE SmartFactoryV2.dbo.STB_ProdRouteHist SET ChangeUserID = 'vanduc', ChangeDate = GETDATE() WHERE LotID = '${targetLot}';\nROLLBACK TRAN;\n-- COMMIT TRAN;`;

      const structured = {
        rootCause: `Màn hình ${matchedScreen.id} - ${matchedScreen.name} (Module: ${matchedScreen.module}). SP gọi: ${matchedScreen.sp_get || matchedScreen.sp_iud}. ${bugDesc}`,
        currentStatus: `Liên kết bảng: ${matchedScreen.tables.join(', ')}. Lot mục tiêu: ${targetLot}.`,
        workaround: `Kiểm tra thao tác trên màn hình ${matchedScreen.id}. Đảm bảo Lot đã qua công đoạn trước và không bị kẹt CompleteRoute.`,
        hotfixSql
      };

      const reply = `### 🎯 BÁO CÁO PHÂN TÍCH MÀN HÌNH ${matchedScreen.id} (${matchedScreen.name})

1. **🎯 Nguyên nhân gốc rễ (Root Cause):**
${structured.rootCause}

2. **📍 Hiện trạng thực tế:**
${structured.currentStatus}

3. **🛠️ Cách OP tự xử lý trên giao diện (Workaround):**
${structured.workaround}

4. **⚡ SQL Hotfix chuẩn (Bọc Transaction an toàn - Author: vanduc):**
\`\`\`sql
${structured.hotfixSql}
\`\`\``;

      return NextResponse.json({
        reply,
        structuredResponse: structured,
        quickActions: [
          { label: `Trace 360° ${targetLot}`, actionType: 'trace', payload: targetLot },
          { label: 'Copy SQL Hotfix', actionType: 'copy_sql', payload: hotfixSql }
        ],
        timestamp: new Date().toISOString()
      });
    }

    if (commonPattern) {
      const hotfixSql = commonPattern.hotfixTemplate(lotMatch ? targetLot : targetMachine);
      const structured = {
        rootCause: commonPattern.rootCause,
        currentStatus: `Hệ thống ghi nhận đối tượng: ${lotMatch ? targetLot : targetMachine}. Đang theo dõi trên SmartFactoryV2 & Kiosk.`,
        workaround: commonPattern.workaround,
        hotfixSql
      };

      const reply = `### 🎯 BÁO CÁO PHÂN TÍCH CHUẨN 4 DÒNG VÀNG

1. **🎯 Nguyên nhân gốc rễ (Root Cause):**
${structured.rootCause}

2. **📍 Hiện trạng thực tế:**
${structured.currentStatus}

3. **🛠️ Cách OP tự xử lý trên giao diện (Workaround):**
${structured.workaround}

4. **⚡ SQL Hotfix chuẩn (Đã bọc Transaction an toàn):**
\`\`\`sql
${structured.hotfixSql}
\`\`\``;

      return NextResponse.json({
        reply,
        structuredResponse: structured,
        quickActions: [
          { label: `Trace 360° ${targetLot}`, actionType: 'trace', payload: targetLot },
          { label: `Mở khóa máy ${targetMachine}`, actionType: 'unlock', payload: targetMachine },
          { label: 'Copy SQL Hotfix', actionType: 'copy_sql', payload: hotfixSql }
        ],
        timestamp: new Date().toISOString()
      });
    }

    // Default friendly domain assistant response
    const defaultReply = `Chào anh **Đức**, Copilot đã ghi nhận yêu cầu: "${message}".

Hệ thống đã nạp đầy đủ ma trận **97 màn hình MES**, **38 mã lỗi POP Kiosk**, **25 biểu mẫu Groupware**, và **15 CSDL**:
- Nhập bất kỳ mã màn hình nào (VD: \`B530\`, \`B540\`, \`B552\`, \`B781\`, \`B782\`, \`F330\`, \`B598\`, \`HN523\`) để tra cứu Stored Procedure, bảng liên quan và giải pháp sửa lỗi.
- Nhập mã lỗi POP Kiosk (VD: \`POP-ERR-09\`, \`POP-ERR-37\`, \`POP-ERR-38\`) để nhận ngay hướng dẫn xử lý và Hotfix bọc Transaction.
- Nhập mã Lot (VD: \`VVQR...\`) để chạy Trace 360°.`;

    return NextResponse.json({
      reply: defaultReply,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({ error: 'Lỗi xử lý yêu cầu: ' + (error as Error).message }, { status: 500 });
  }
}
