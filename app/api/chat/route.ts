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
                  text: `Bạn là Antigravity - Trợ lý AI Vận Hành Cao Cấp của hệ thống Vinatech MES & POP (Author/ChangeUserID='vanduc').
Nhiệm vụ: Chẩn đoán sự cố sản xuất, Kiosk POP, Groupware, ERP 5 CSDL dựa trên ma trận 97 màn hình MES và 38 mã lỗi POP Kiosk.
QUY TẮC CỐT LÕI (BẤT BIẾN):
- Mọi chẩn đoán sự cố sản xuất/Kiosk BẮT BUỘC trả lời chuẩn "4 DÒNG VÀNG":
  1. 🎯 Nguyên nhân gốc rễ (Root Cause): Màn hình, SP, cơ chế lỗi.
  2. 📍 Hiện trạng thực tế: Vị trí Lot, bảng kẹt.
  3. 🛠️ Cách OP tự xử lý trên giao diện (Workaround): Bước 1-2-3 dứt khoát cho công nhân.
  4. ⚡ SQL Hotfix chuẩn (Nếu IT can thiệp): Bọc BEGIN TRAN...ROLLBACK, gắn ChangeUserID='vanduc'.
- 5 NGUYÊN TẮC BẤT BIẾN EA PLAYBOOK (RULE 20):
  1. Đổi máy nhầm Kiosk: Bắt buộc UPDATE CẢ 2 BẢNG (STB_ProdRouteHist VÀ MongoToMesPerformance).
  2. Lỗi 'Already completed': Do WinForm sinh sẵn dòng kế tiếp, xóa dòng thừa trong STB_ProdRouteHist & STB_ProdRouteWorkerHist.
  3. Nút Cắt điện cực mờ: Do MaterialThickness < 100 trong STB_MaterialMaster.
  4. Nạp cuộn BTP: Tối đa 3 LOTNO cho 1 mã cắt.
  5. Định tuyến PO bị thiếu công đoạn chuẩn (như Aging V-26_HY): Kiểm tra STB_ProductionOrderRouting vs STB_BasicRoutingDetail và bổ sung dòng định tuyến bị xóa.
- ĐỊNH DANH SỰ CỐ & PHÂN LOẠI ISSUE (RULE 22):
  Mọi sự cố, task, ticket hoặc báo cáo tuần liên quan đến POP (Kiosk xưởng, Web POP, nạp NVL Kiosk, kẹt máy Kiosk, đồng bộ MongoToMesPerformance) BẮT BUỘC ghi phân loại/hệ thống là POP, TUYỆT ĐỐI KHÔNG ghi là MES. MES chỉ dành riêng cho Core MES Sản Xuất WinForm B-series & CSDL lõi.`
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
    let matchedScreen = screenMatch ? getAllScreens().find(s => (s.id || '').toUpperCase() === screenMatch[0].toUpperCase()) : null;

    // Check if matched a specific POP Error Code (e.g. POP-ERR-09, POP-ERR-37)
    const popErrMatch = message.match(/POP-ERR-\d{2}/i);
    let matchedPopErr = popErrMatch ? getAllPopErrors().find(e => (e.code || '').toUpperCase() === popErrMatch[0].toUpperCase()) : null;

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
        ? `-- Hotfix tu POP-ERR: ${matchedPopErr.code}\nBEGIN TRAN;\n  ${matchedPopErr.fast_fix.replace(/<Lots>/g, targetLot).replace(/<Lot>/g, targetLot)}\nROLLBACK TRAN;\n-- COMMIT TRAN;`
        : `-- Tra cuu & Khac phuc theo Rule 20\nBEGIN TRAN;\n  UPDATE VINATECH_POP.dbo.MongoToMesPerformance SET MachineCode = '${targetMachine}' WHERE LotID = '${targetLot}';\nROLLBACK TRAN;\n-- COMMIT TRAN;`;

      const structured = {
        rootCause: `[${matchedPopErr.code}] ${matchedPopErr.title}: ${matchedPopErr.root_cause}`,
        currentStatus: `Đối tượng liên quan: ${targetLot}. Tra cứu tức thì từ Ma Trận L1 Cache POP_MATRIX (38 mã lỗi Kiosk).`,
        workaround: `OP thao tác theo hướng dẫn: ${matchedPopErr.fast_fix.split('—')[0]}`,
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
          { label: `Soi Huyết Mạch ${targetLot}`, actionType: 'lineage', payload: targetLot },
          { label: 'Copy SQL Hotfix', actionType: 'copy_sql', payload: hotfixSql }
        ],
        timestamp: new Date().toISOString()
      });
    }

    if (matchedScreen) {
      const bugKeys = Object.keys(matchedScreen.common_bugs);
      const bugDesc = bugKeys.length > 0 ? matchedScreen.common_bugs[bugKeys[0]] : 'Lỗi phát sinh trong quá trình chốt dữ liệu công đoạn.';
      const hotfixSql = matchedScreen.fix_template || `-- Hotfix man hinh ${matchedScreen.id}\nBEGIN TRAN;\n  UPDATE SmartFactoryV2.dbo.STB_ProdRouteHist SET ChangeUserID = 'vanduc', ChangeDate = GETDATE() WHERE LotID = '${targetLot}';\nROLLBACK TRAN;\n-- COMMIT TRAN;`;

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
          { label: `Soi Huyết Mạch ${targetLot}`, actionType: 'lineage', payload: targetLot },
          { label: 'Copy SQL Hotfix', actionType: 'copy_sql', payload: hotfixSql }
        ],
        timestamp: new Date().toISOString()
      });
    }

    // Default friendly domain assistant response with comprehensive prompt intelligence
    const defaultReply = `Chào anh **Đức (Kỹ sư IT - EA Team)**! Copilot đã phân tích yêu cầu: "${message}".

Hệ thống điều hành sản xuất được trang bị:
1. **Ma Trận L1 Cache:** 97 màn hình WinForm, 38 mã lỗi POP Kiosk, 25 biểu mẫu Groupware, 15 CSDL.
2. **5 Nguyên Tắc Bất Biến EA Playbook (Rule 20):**
   - Đổi máy Kiosk update đồng thời 2 bảng (\`STB_ProdRouteHist\` & \`MongoToMesPerformance\`).
   - Lỗi 'Already completed' xóa dòng thừa \`CompleteRoute IS NULL\`.
   - Cắt điện cực mờ do độ dày \`< 100\`.
   - Nạp cuộn BTP tối đa 3 LOTNO.
   - Giải phóng máy kẹt ACTIVE tức thời 1-Click.
3. **Thao tác nhanh:**
   - Gõ mã Lot (\`VVQR...\`) hoặc PO (\`2608...\`) để kích hoạt Trace 360°.
   - Gõ mã màn hình (\`B530\`, \`B782\`, \`B552\`) để xem Stored Procedure và giải pháp lỗi.
   - Gõ mã thiết bị (\`VVMHY130\`) để mở khóa thiết bị.`;

    return NextResponse.json({
      reply: defaultReply,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({ error: 'Lỗi xử lý yêu cầu: ' + (error as Error).message }, { status: 500 });
  }
}
