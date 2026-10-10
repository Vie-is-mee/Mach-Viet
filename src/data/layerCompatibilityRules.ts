import {
  InnerLayerId,
  BottomLayerId,
  AccessoryHeadId,
  AccessoryHandId,
  LayerItemMeta,
  LayerCompatibilityEntry,
  StudioOutfitState,
} from '../types';

/**
 * Danh sách mô tả các lớp y phục và phụ kiện hiện Studio hỗ trợ
 * Tái sử dụng chính xác các mã ID đã thiết lập trong hệ thống
 */
export const INNER_LAYER_OPTIONS: LayerItemMeta<InnerLayerId>[] = [
  {
    id: 'ao-lot-trang',
    name: 'Áo lót trắng cổ đứng',
    subName: 'Áo lót trong / áo lá bảo hộ',
    description: 'Áo lót dệt bằng vải bông hoặc tơ trắng nhẹ, cổ lập lĩnh đứng thấp giữ vệ sinh cổ áo ngoài và nếp áo trang nghiêm.',
  },
  {
    id: 'yem-dao',
    name: 'Yếm lụa đào',
    subName: 'Yếm che ngực truyền thống',
    description: 'Áo yếm lụa hồng đào cắt hình quả trám, quai cổ và quai lưng thắt gọn, gắn liền với phong vị dân gian phụ nữ Bắc Bộ.',
  },
];

export const BOTTOM_LAYER_OPTIONS: LayerItemMeta<BottomLayerId>[] = [
  {
    id: 'quan-lua-trang',
    name: 'Quần lụa trắng',
    subName: 'Hạ y lụa ống suông buông rủ',
    description: 'Quần hai ống may bằng tơ lụa trắng mềm mại, dài chấm mu bàn chân, quy chuẩn kinh điển cho Áo ngũ thân, Áo tấc và Áo dài.',
  },
  {
    id: 'quan-den',
    name: 'Quần lụa đen',
    subName: 'Quần lụa đen / nhuộm tự nhiên',
    description: 'Quần lụa đen ống suông trang nhã, tạo nét tương phản cổ điển, phù hợp cho cả sinh hoạt thường nhật và áo tứ thân.',
  },
  {
    id: 'vay-xep-ly',
    name: 'Váy đụp / Váy xòe',
    subName: 'Hạ y dân gian truyền thống',
    description: 'Váy xòe rộng màu sẫm may bằng vải thô hoặc sồi, gắn liền với tập quán phụ nữ đồng bằng sông Hồng xưa khi mặc áo tứ thân.',
  },
];

export const ACCESSORY_HEAD_OPTIONS: LayerItemMeta<AccessoryHeadId>[] = [
  {
    id: 'khan-dong',
    name: 'Khăn đóng xếp nếp',
    subName: 'Khăn quấn sẵn chữ Nhân/chữ Nhất',
    description: 'Khăn đóng may sẵn với các nếp xếp đều đặn ngay ngắn, trang phục chuẩn mực của người Việt thời Nguyễn.',
  },
  {
    id: 'khan-van',
    name: 'Khăn vấn tóc lụa',
    subName: 'Khăn vấn vành tóc truyền thống',
    description: 'Dải vải nhung hoặc lụa vấn chặt quanh lọn tóc tạo hình vành tròn quanh đầu, mang nét duyên dáng đài các.',
  },
  {
    id: 'non-la',
    name: 'Nón lá truyền thống',
    subName: 'Nón chóp đan lá nón mộc mạc',
    description: 'Biểu tượng văn hóa mộc mạc của người Việt, che nắng mưa và tôn dáng thanh thoát khi mặc áo tứ thân hoặc áo dài.',
  },
  {
    id: 'none',
    name: 'Để tóc tự nhiên',
    subName: 'Không đội khăn / phong cách trẻ',
    description: 'Tóc buông tự nhiên hoặc kẹp gọn nhẹ nhàng, phù hợp cho học sinh, sinh viên dạo phố hay kỷ yếu học đường.',
  },
];

export const ACCESSORY_HAND_OPTIONS: LayerItemMeta<AccessoryHandId>[] = [
  {
    id: 'quat-nan',
    name: 'Quạt nan lụa thêu',
    subName: 'Quạt xếp / quạt tròn thêu tay',
    description: 'Phụ kiện cầm tay thanh nhã, điểm xuyết hoa sen, chim muông hoặc họa tiết phong cảnh trang nhã.',
  },
  {
    id: 'tui-gam',
    name: 'Túi gấm truyền thống',
    subName: 'Túi thêu hoa văn cổ phong',
    description: 'Túi nhỏ dệt gấm đựng tư trang cá nhân, hài hòa với phong cách cổ phong.',
  },
  {
    id: 'tui-coi',
    name: 'Túi cói đan mộc',
    subName: 'Túi quai xách đan cói dân tộc/dân gian',
    description: 'Túi cói/mây tre đan tay mộc mạc với quai xách bên tay, hòa hợp với phong vị dân gian đồng quê Bắc Bộ và dạo phố.',
  },
  {
    id: 'none',
    name: 'Để tay tự nhiên',
    subName: 'Tư thế đứng chuẩn mực',
    description: 'Khoanh tay trang trọng (đối với áo tấc/ngũ thân) hoặc để tay tự nhiên thoải mái khi dạo phố.',
  },
];

/**
 * Bản đồ quy tắc tương thích cho từng mẫu áo chính
 * Quản lý tập trung: vì sao món A được gợi ý hoặc không khuyến nghị cho áo B
 * Tránh việc khẳng định cứng nhắc khi chưa có nguồn học thuật chứng minh
 */
export interface GarmentCompatibilityProfile {
  garmentId: string;
  garmentName: string;
  category: string;
  defaultLayers: {
    innerLayer: InnerLayerId;
    bottomLayer: BottomLayerId;
    accessoryHead: AccessoryHeadId;
    accessoryHand: AccessoryHandId;
  };
  innerLayers: Record<InnerLayerId, LayerCompatibilityEntry>;
  bottomLayers: Record<BottomLayerId, LayerCompatibilityEntry>;
  accessoryHeads: Record<AccessoryHeadId, LayerCompatibilityEntry>;
  accessoryHands: Record<AccessoryHandId, LayerCompatibilityEntry>;
  culturalNotes: {
    summary: string;
    academicStatus: 'verified_convention' | 'experimental_suggestion';
    sourceNotice: string;
  };
}

export const GARMENT_COMPATIBILITY_RULES: Record<string, GarmentCompatibilityProfile> = {
  // 1. ÁO DÀI HIỆN ĐẠI
  'ao-dai-hien-dai': {
    garmentId: 'ao-dai-hien-dai',
    garmentName: 'Áo Dài Hiện Đại (Tân Thời)',
    category: 'ao_dai',
    defaultLayers: {
      innerLayer: 'ao-lot-trang',
      bottomLayer: 'quan-lua-trang',
      accessoryHead: 'none',
      accessoryHand: 'quat-nan',
    },
    innerLayers: {
      'ao-lot-trang': {
        isCompatible: true,
        isRecommended: true,
        reason: 'Áo lá / áo lót trắng giữ nét kín đáo thanh lịch dưới tà lụa mỏng.',
        verificationLevel: 'verified_convention',
      },
      'yem-dao': {
        isCompatible: false,
        reason: 'Áo dài tân thời thân ôm xẻ tà cao, quy cách thường dùng áo lót kín đáo; không phối cùng yếm đào lộ quai.',
        verificationLevel: 'not_recommended',
      },
    },
    bottomLayers: {
      'quan-lua-trang': {
        isCompatible: true,
        isRecommended: true,
        reason: 'Quần lụa trắng ống suông là quy chuẩn kinh điển cho áo dài học sinh, sinh viên.',
        verificationLevel: 'verified_convention',
      },
      'quan-den': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Quần lụa đen tạo phong cách thanh nhã hoài niệm thế kỷ 20.',
        verificationLevel: 'verified_convention',
      },
      'vay-xep-ly': {
        isCompatible: false,
        reason: 'Áo dài hai tà xẻ cao mặc cùng quần ống suông; chưa có tư liệu văn hóa cho dạng phối cùng váy đụp.',
        verificationLevel: 'not_recommended',
      },
    },
    accessoryHeads: {
      'none': {
        isCompatible: true,
        isRecommended: true,
        reason: 'Để tóc tự nhiên là nét đẹp thanh xuân đặc trưng của học sinh, sinh viên.',
        verificationLevel: 'verified_convention',
      },
      'khan-van': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Khăn vấn cách tân tạo điểm nhấn đoan trang khi chụp kỷ yếu.',
        verificationLevel: 'experimental_suggestion',
      },
      'khan-dong': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Khăn đóng thường dùng cho nghi lễ truyền thống hoặc áo dài nam.',
        verificationLevel: 'experimental_suggestion',
      },
      'non-la': {
        isCompatible: true,
        isRecommended: true,
        reason: 'Nón lá kết hợp cùng áo dài là hình ảnh biểu trưng kinh điển của vẻ đẹp Việt Nam thanh thoát.',
        verificationLevel: 'verified_convention',
      },
    },
    accessoryHands: {
      'quat-nan': {
        isCompatible: true,
        isRecommended: true,
        reason: 'Quạt nan lụa thêu tăng thêm nét duyên dáng khi tạo dáng.',
        verificationLevel: 'experimental_suggestion',
      },
      'tui-gam': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Túi gấm nhỏ gọn tiện lợi dạo phố.',
        verificationLevel: 'experimental_suggestion',
      },
      'tui-coi': {
        isCompatible: true,
        isRecommended: true,
        reason: 'Túi cói mộc mạc là phụ kiện dạo phố/chụp ảnh kỷ yếu rất được yêu thích với áo dài.',
        verificationLevel: 'experimental_suggestion',
      },
      'none': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Để tay tự nhiên giúp cử động linh hoạt.',
        verificationLevel: 'verified_convention',
      },
    },
    culturalNotes: {
      summary: 'Quy chuẩn y phục hiện đại: Hai tà dài xẻ eo mặc cùng quần lụa suông.',
      academicStatus: 'verified_convention',
      sourceNotice: 'Dựa trên tiến trình biến đổi của áo dài thế kỷ 20 (tham khảo Vietnam National Administration of Tourism).',
    },
  },

  // 2. ÁO TỨ THÂN
  'ao-tu-than': {
    garmentId: 'ao-tu-than',
    garmentName: 'Áo Tứ Thân',
    category: 'ao_tu_than',
    defaultLayers: {
      innerLayer: 'yem-dao',
      bottomLayer: 'vay-xep-ly',
      accessoryHead: 'khan-van',
      accessoryHand: 'quat-nan',
    },
    innerLayers: {
      'yem-dao': {
        isCompatible: true,
        isRecommended: true,
        reason: 'Yếm lụa đào là lớp lót kinh điển gắn liền với bốn vạt áo tứ thân Bắc Bộ.',
        verificationLevel: 'verified_convention',
      },
      'ao-lot-trang': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Gợi ý biến tấu đương đại: Áo lót kín đáo thay cho yếm khi tham gia sự kiện học đường năng động.',
        verificationLevel: 'experimental_suggestion',
      },
    },
    bottomLayers: {
      'vay-xep-ly': {
        isCompatible: true,
        isRecommended: true,
        reason: 'Váy đụp thắt dải lưng là trang phục dân gian tiêu biểu của phụ nữ Bắc Bộ xưa.',
        verificationLevel: 'verified_convention',
      },
      'quan-den': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Quần nhuộm sẫm/đen gọn gàng thuận tiện cho việc di chuyển dạo phố.',
        verificationLevel: 'experimental_suggestion',
      },
      'quan-lua-trang': {
        isCompatible: false,
        reason: 'Tứ thân dân gian Bắc Bộ theo tập quán mặc váy sẫm hoặc quần đen; quần lụa trắng tinh khôi không phải trang phục lao động/dân gian truyền thống này.',
        verificationLevel: 'not_recommended',
      },
    },
    accessoryHeads: {
      'khan-van': {
        isCompatible: true,
        isRecommended: true,
        reason: 'Khăn vấn tóc (vành khăn) kết hợp cùng nón quai thao tôn nét mộc mạc dân gian.',
        verificationLevel: 'verified_convention',
      },
      'none': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Tóc tự nhiên cột thấp cho các buổi dạo phố trẻ trung.',
        verificationLevel: 'experimental_suggestion',
      },
      'khan-dong': {
        isCompatible: false,
        reason: 'Khăn đóng xếp nếp nẹp cứng thời Nguyễn không tương thích với bối cảnh áo tứ thân dân gian châu thổ Bắc Bộ.',
        verificationLevel: 'not_recommended',
      },
      'non-la': {
        isCompatible: true,
        isRecommended: true,
        reason: 'Nón lá cùng áo tứ thân là biểu tượng dân gian đặc trưng, che mát và tôn dáng mộc mạc.',
        verificationLevel: 'verified_convention',
      },
    },
    accessoryHands: {
      'quat-nan': {
        isCompatible: true,
        isRecommended: true,
        reason: 'Quạt nan lụa tạo nét duyên dáng khi biểu diễn hoặc chụp ảnh dân ca quan họ.',
        verificationLevel: 'experimental_suggestion',
      },
      'tui-gam': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Túi gấm nhỏ làm điểm nhấn phụ kiện đương đại.',
        verificationLevel: 'experimental_suggestion',
      },
      'tui-coi': {
        isCompatible: true,
        isRecommended: true,
        reason: 'Túi cói đan mộc kết hợp hoàn hảo cùng chất mộc mạc của áo tứ thân Bắc Bộ.',
        verificationLevel: 'verified_convention',
      },
      'none': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Hai tay thắt vạt áo tự nhiên trước bụng.',
        verificationLevel: 'verified_convention',
      },
    },
    culturalNotes: {
      summary: 'Gợi ý thiết kế thử nghiệm: Phối yếm đào, váy đụp và khăn vấn lụa.',
      academicStatus: 'experimental_suggestion',
      sourceNotice: 'Tư liệu dân gian về áo tứ thân còn phân tán; các kết hợp ở đây là gợi ý thiết kế mô phỏng, cần tiếp tục đối chiếu với tài liệu nghiên cứu dân tộc học chính thống.',
    },
  },

  // 3. ÁO NGŨ THÂN TAY CHẼN
  'ngu-than-tay-chen': {
    garmentId: 'ngu-than-tay-chen',
    garmentName: 'Áo Ngũ Thân Tay Chẽn',
    category: 'ao_ngu_than',
    defaultLayers: {
      innerLayer: 'ao-lot-trang',
      bottomLayer: 'quan-lua-trang',
      accessoryHead: 'khan-dong',
      accessoryHand: 'quat-nan',
    },
    innerLayers: {
      'ao-lot-trang': {
        isCompatible: true,
        isRecommended: true,
        reason: 'Áo lót trắng cổ đứng giữ vệ sinh cổ áo lập lĩnh và tạo đường viền trắng tinh tế nơi cổ áo.',
        verificationLevel: 'verified_convention',
      },
      'yem-dao': {
        isCompatible: false,
        reason: 'Áo ngũ thân cài khuy kín hữu nhậm, bên trong quy định mặc áo lót trắng, không phối cùng yếm đào hở cổ.',
        verificationLevel: 'not_recommended',
      },
    },
    bottomLayers: {
      'quan-lua-trang': {
        isCompatible: true,
        isRecommended: true,
        reason: 'Quần lụa trắng là quy cách hạ y chuẩn mực cho cả nam và nữ thời Nguyễn.',
        verificationLevel: 'verified_convention',
      },
      'quan-den': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Quần lụa đen thường dùng trong sinh hoạt thường nhật thời trước.',
        verificationLevel: 'verified_convention',
      },
      'vay-xep-ly': {
        isCompatible: false,
        reason: 'Sắc lệnh cải cách trang phục thời chúa Nguyễn Phúc Khoát và vua Minh Mạng quy định người mặc áo ngũ thân phải mặc quần hai ống, cấm mặc váy.',
        verificationLevel: 'not_recommended',
      },
    },
    accessoryHeads: {
      'khan-dong': {
        isCompatible: true,
        isRecommended: true,
        reason: 'Khăn đóng xếp nếp là phụ kiện đồng bộ chuẩn mực tạo phong thái đĩnh đạc.',
        verificationLevel: 'verified_convention',
      },
      'khan-van': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Khăn vấn tóc lụa phù hợp với phong thái nhã nhặn của nữ giới.',
        verificationLevel: 'verified_convention',
      },
      'none': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Để tóc tự nhiên - biến tấu gọn gàng hiện đại cho học sinh, sinh viên.',
        verificationLevel: 'experimental_suggestion',
      },
      'non-la': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Nón lá có thể dùng khi che nắng dạo phố cùng áo ngũ thân cách tân, nhưng không thuộc quy thức lễ nghi truyền thống.',
        verificationLevel: 'experimental_suggestion',
      },
    },
    accessoryHands: {
      'quat-nan': {
        isCompatible: true,
        isRecommended: true,
        reason: 'Quạt nan lụa thêu tạo nét nho nhã, lịch lãm khi dạo phố.',
        verificationLevel: 'experimental_suggestion',
      },
      'tui-gam': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Túi gấm nhỏ làm phụ kiện chứa đồ cá nhân.',
        verificationLevel: 'experimental_suggestion',
      },
      'tui-coi': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Gợi ý dạo phố phong cách trẻ trung năng động; lễ tục truyền thống thường chuộng túi gấm.',
        verificationLevel: 'experimental_suggestion',
      },
      'none': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Để tay tự nhiên giúp di chuyển thoải mái.',
        verificationLevel: 'verified_convention',
      },
    },
    culturalNotes: {
      summary: 'Quy chế y phục chuẩn mực: Áo ngũ thân khuy hữu nhậm, áo lót trắng và quần hai ống.',
      academicStatus: 'verified_convention',
      sourceNotice: 'Quy chuẩn thời Nguyễn (tham chiếu tư liệu Sở Văn hóa và Thể thao TP.HCM và Khâm Định Đại Nam Hội Điển Sự Lệ).',
    },
  },

  // 4. ÁO TẤC (NGŨ THÂN TAY THỤNG)
  'ao-tac-ngu-than-tay-thung': {
    garmentId: 'ao-tac-ngu-than-tay-thung',
    garmentName: 'Áo Tấc (Ngũ Thân Tay Thụng)',
    category: 'ao_ngu_than',
    defaultLayers: {
      innerLayer: 'ao-lot-trang',
      bottomLayer: 'quan-lua-trang',
      accessoryHead: 'khan-dong',
      accessoryHand: 'none',
    },
    innerLayers: {
      'ao-lot-trang': {
        isCompatible: true,
        isRecommended: true,
        reason: 'Áo lót trắng cổ đứng giữ nếp tôn nghiêm cho lễ phục cổ truyền.',
        verificationLevel: 'verified_convention',
      },
      'yem-dao': {
        isCompatible: false,
        reason: 'Lễ phục đại lễ trang nghiêm, cổ cài kín khuy hữu nhậm, không mặc cùng yếm.',
        verificationLevel: 'not_recommended',
      },
    },
    bottomLayers: {
      'quan-lua-trang': {
        isCompatible: true,
        isRecommended: true,
        reason: 'Quần lụa trắng ống rộng tạo vẻ uy nghi đồng bộ với tay thụng to bản.',
        verificationLevel: 'verified_convention',
      },
      'quan-den': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Quần lụa đen trang nghiêm trong các nghi thức tưởng niệm.',
        verificationLevel: 'verified_convention',
      },
      'vay-xep-ly': {
        isCompatible: false,
        reason: 'Áo tấc triều Nguyễn là lễ phục quy định nghiêm ngặt mặc cùng quần hai ống.',
        verificationLevel: 'not_recommended',
      },
    },
    accessoryHeads: {
      'khan-dong': {
        isCompatible: true,
        isRecommended: true,
        reason: 'Khăn đóng xếp nếp là thành phần bắt buộc trong lễ phục áo tấc truyền thống.',
        verificationLevel: 'verified_convention',
      },
      'khan-van': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Khăn vấn tóc lụa sang trọng cho nữ giới trong lễ tốt nghiệp hoặc lễ cưới.',
        verificationLevel: 'verified_convention',
      },
      'none': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Gợi ý thử nghiệm hiện đại: Để tóc tự nhiên trong không gian sự kiện sinh viên.',
        verificationLevel: 'experimental_suggestion',
      },
      'non-la': {
        isCompatible: false,
        reason: 'Áo tấc là lễ phục đại lễ trang nghiêm thời Nguyễn; quy thức bắt buộc dùng khăn đóng hoặc khăn vấn, không đội nón lá dân gian.',
        verificationLevel: 'not_recommended',
      },
    },
    accessoryHands: {
      'none': {
        isCompatible: true,
        isRecommended: true,
        reason: 'Khi khoanh tay làm lễ, hai tay áo thụng buông rủ giao nhau tạo phom dáng vuông vức tôn nghiêm.',
        verificationLevel: 'verified_convention',
      },
      'quat-nan': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Quạt nan lụa thêu cầm tay khi di chuyển ngoài trời.',
        verificationLevel: 'experimental_suggestion',
      },
      'tui-gam': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Túi gấm đeo nhẹ nhàng không làm gãy nếp tay thụng.',
        verificationLevel: 'experimental_suggestion',
      },
      'tui-coi': {
        isCompatible: false,
        reason: 'Túi cói đan mộc dân dã không tương thích với lễ phục trang nghiêm quy chuẩn triều đình của áo tấc.',
        verificationLevel: 'not_recommended',
      },
    },
    culturalNotes: {
      summary: 'Quy chuẩn lễ nghi: Tay thụng to bản buông rủ dài, bắt buộc quần hai ống và khăn đóng/vấn.',
      academicStatus: 'verified_convention',
      sourceNotice: 'Tư liệu lễ tục triều Nguyễn; khi khoanh tay cần giữ đúng quy thức trang trọng.',
    },
  },

  // 5. ÁO NHẬT BÌNH
  'ao-nhat-binh': {
    garmentId: 'ao-nhat-binh',
    garmentName: 'Áo Nhật Bình',
    category: 'ao_nhat_binh',
    defaultLayers: {
      innerLayer: 'ao-lot-trang',
      bottomLayer: 'quan-lua-trang',
      accessoryHead: 'khan-van',
      accessoryHand: 'quat-nan',
    },
    innerLayers: {
      'ao-lot-trang': {
        isCompatible: true,
        isRecommended: true,
        reason: 'Áo Nhật Bình khoác bên ngoài áo lót trắng hoặc áo ngũ thân lụa mềm mại.',
        verificationLevel: 'verified_convention',
      },
      'yem-dao': {
        isCompatible: false,
        reason: 'Áo Nhật Bình là thường phục cao cấp có nẹp cổ chữ nhật trang trọng, không có tư liệu mặc trực tiếp trên yếm hở.',
        verificationLevel: 'not_recommended',
      },
    },
    bottomLayers: {
      'quan-lua-trang': {
        isCompatible: true,
        isRecommended: true,
        reason: 'Quần lụa trắng buông suông là lớp hạ y trang nhã dưới tà áo xẻ giữa buông thẳng.',
        verificationLevel: 'verified_convention',
      },
      'quan-den': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Quần lụa đen trang nhã tạo phong thái trầm ổn.',
        verificationLevel: 'verified_convention',
      },
      'vay-xep-ly': {
        isCompatible: false,
        reason: 'Theo quy chế thời Nguyễn, phụ nữ hoàng tộc và mệnh phụ mặc Nhật Bình cùng quần hai ống, không phối váy đụp.',
        verificationLevel: 'not_recommended',
      },
    },
    accessoryHeads: {
      'khan-van': {
        isCompatible: true,
        isRecommended: true,
        reason: 'Khăn vấn lụa (hoặc khăn vấn gấm/vành) tôn nẹp cổ chữ nhật quý phái của áo Nhật Bình.',
        verificationLevel: 'verified_convention',
      },
      'khan-dong': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Khăn đóng xếp nếp (gợi ý biến tấu cho sự kiện chụp ảnh).',
        verificationLevel: 'experimental_suggestion',
      },
      'none': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Để tóc tự nhiên - gợi ý thử nghiệm cho người trẻ dạo phố cổ phong.',
        verificationLevel: 'experimental_suggestion',
      },
      'non-la': {
        isCompatible: false,
        reason: 'Áo Nhật Bình là thường phục hoàng tộc/mệnh phụ triều Nguyễn, không có thông lệ hay tư liệu văn hóa kết hợp cùng nón lá dân dã.',
        verificationLevel: 'not_recommended',
      },
    },
    accessoryHands: {
      'quat-nan': {
        isCompatible: true,
        isRecommended: true,
        reason: 'Quạt nan lụa thêu hoa sen / hoa cúc là phụ kiện cung đình tiêu biểu.',
        verificationLevel: 'verified_convention',
      },
      'tui-gam': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Túi gấm thêu hoa văn truyền thống.',
        verificationLevel: 'experimental_suggestion',
      },
      'tui-coi': {
        isCompatible: false,
        reason: 'Túi cói mộc mạc dân gian không phù hợp với quy chuẩn quý phái cung đình của áo Nhật Bình.',
        verificationLevel: 'not_recommended',
      },
      'none': {
        isCompatible: true,
        isRecommended: false,
        reason: 'Để tay tự nhiên giúp bước đi khoan thai.',
        verificationLevel: 'verified_convention',
      },
    },
    culturalNotes: {
      summary: 'Gợi ý thiết kế trải nghiệm: Khoác ngoài y phục kín cổ, đi cùng quần lụa suông và quạt nan.',
      academicStatus: 'experimental_suggestion',
      sourceNotice: 'Khảo cứu thư tịch: Điển chế Khâm Định Đại Nam Hội Điển Sự Lệ quy định chặt chẽ màu sắc hoa văn theo phẩm trật hoàng tộc; bản phối hiện tại mang tính gợi ý thiết kế trải nghiệm cho học sinh, sinh viên, không khẳng định là chuẩn tuyệt đối mọi phẩm trật.',
    },
  },
};

/**
 * Lấy quy tắc kiểm tra tương thích cho 1 món cụ thể với 1 áo chính
 */
export function checkLayerCompatibility(
  garmentId: string,
  slot: 'innerLayer' | 'bottomLayer' | 'accessoryHead' | 'accessoryHand',
  itemId: string
): LayerCompatibilityEntry {
  const rule = GARMENT_COMPATIBILITY_RULES[garmentId] || GARMENT_COMPATIBILITY_RULES['ngu-than-tay-chen'];
  
  if (slot === 'innerLayer') {
    return rule.innerLayers[itemId as InnerLayerId] || {
      isCompatible: false,
      reason: 'Mã lớp lót không hợp lệ',
      verificationLevel: 'not_recommended',
    };
  }
  if (slot === 'bottomLayer') {
    return rule.bottomLayers[itemId as BottomLayerId] || {
      isCompatible: false,
      reason: 'Mã hạ y không hợp lệ',
      verificationLevel: 'not_recommended',
    };
  }
  if (slot === 'accessoryHead') {
    return rule.accessoryHeads[itemId as AccessoryHeadId] || {
      isCompatible: false,
      reason: 'Mã phụ kiện đầu không hợp lệ',
      verificationLevel: 'not_recommended',
    };
  }
  if (slot === 'accessoryHand') {
    return rule.accessoryHands[itemId as AccessoryHandId] || {
      isCompatible: false,
      reason: 'Mã phụ kiện cầm tay không hợp lệ',
      verificationLevel: 'not_recommended',
    };
  }

  return {
    isCompatible: false,
    reason: 'Không tìm thấy quy tắc',
    verificationLevel: 'not_recommended',
  };
}

export interface GarmentTransitionResult {
  nextOutfit: StudioOutfitState;
  hasAutoChanged: boolean;
  changedItems: {
    slotName: string;
    fromLabel: string;
    toLabel: string;
    reason: string;
  }[];
  retainedItems: {
    slotName: string;
    label: string;
  }[];
  summaryMessage: string;
}

/**
 * Xử lý chuyển đổi áo chính thông minh & an toàn:
 * - Món nào ĐÃ HỢP LỆ với áo mới: GIỮ NGUYÊN.
 * - Món nào KHÔNG HỢP LỆ: Tự động đổi sang món gợi ý mặc định và BÁO CÁO RÕ RÀNG lý do.
 * - Không bao giờ âm thầm đổi hết cả bộ.
 */
export function resolveGarmentLayerTransition(
  oldGarmentId: string,
  newGarmentId: string,
  currentOutfit: StudioOutfitState
): GarmentTransitionResult {
  const newRule = GARMENT_COMPATIBILITY_RULES[newGarmentId] || GARMENT_COMPATIBILITY_RULES['ngu-than-tay-chen'];
  const nextOutfit: StudioOutfitState = {
    ...currentOutfit,
    garmentId: newGarmentId,
  };

  const changedItems: GarmentTransitionResult['changedItems'] = [];
  const retainedItems: GarmentTransitionResult['retainedItems'] = [];

  // 1. Kiểm tra Lớp lót
  const innerCheck = newRule.innerLayers[currentOutfit.innerLayer];
  if (innerCheck && innerCheck.isCompatible) {
    const meta = INNER_LAYER_OPTIONS.find((i) => i.id === currentOutfit.innerLayer);
    retainedItems.push({
      slotName: 'Lớp lót',
      label: meta?.name || currentOutfit.innerLayer,
    });
  } else {
    const prevMeta = INNER_LAYER_OPTIONS.find((i) => i.id === currentOutfit.innerLayer);
    const newInner = newRule.defaultLayers.innerLayer;
    const nextMeta = INNER_LAYER_OPTIONS.find((i) => i.id === newInner);
    nextOutfit.innerLayer = newInner;
    changedItems.push({
      slotName: 'Lớp lót',
      fromLabel: prevMeta?.name || currentOutfit.innerLayer,
      toLabel: nextMeta?.name || newInner,
      reason: innerCheck?.reason || `Phù hợp với thiết kế của ${newRule.garmentName}`,
    });
  }

  // 2. Kiểm tra Hạ y
  const bottomCheck = newRule.bottomLayers[currentOutfit.bottomLayer];
  if (bottomCheck && bottomCheck.isCompatible) {
    const meta = BOTTOM_LAYER_OPTIONS.find((b) => b.id === currentOutfit.bottomLayer);
    retainedItems.push({
      slotName: 'Hạ y (quần/váy)',
      label: meta?.name || currentOutfit.bottomLayer,
    });
  } else {
    const prevMeta = BOTTOM_LAYER_OPTIONS.find((b) => b.id === currentOutfit.bottomLayer);
    const newBottom = newRule.defaultLayers.bottomLayer;
    const nextMeta = BOTTOM_LAYER_OPTIONS.find((b) => b.id === newBottom);
    nextOutfit.bottomLayer = newBottom;
    changedItems.push({
      slotName: 'Hạ y (quần/váy)',
      fromLabel: prevMeta?.name || currentOutfit.bottomLayer,
      toLabel: nextMeta?.name || newBottom,
      reason: bottomCheck?.reason || `Phù hợp với quy chuẩn hạ y của ${newRule.garmentName}`,
    });
  }

  // 3. Kiểm tra Khăn đội đầu
  const headCheck = newRule.accessoryHeads[currentOutfit.accessoryHead];
  if (headCheck && headCheck.isCompatible) {
    const meta = ACCESSORY_HEAD_OPTIONS.find((h) => h.id === currentOutfit.accessoryHead);
    retainedItems.push({
      slotName: 'Khăn đội đầu',
      label: meta?.name || currentOutfit.accessoryHead,
    });
  } else {
    const prevMeta = ACCESSORY_HEAD_OPTIONS.find((h) => h.id === currentOutfit.accessoryHead);
    const newHead = newRule.defaultLayers.accessoryHead;
    const nextMeta = ACCESSORY_HEAD_OPTIONS.find((h) => h.id === newHead);
    nextOutfit.accessoryHead = newHead;
    changedItems.push({
      slotName: 'Khăn đội đầu',
      fromLabel: prevMeta?.name || currentOutfit.accessoryHead,
      toLabel: nextMeta?.name || newHead,
      reason: headCheck?.reason || `Gợi ý phù hợp với ${newRule.garmentName}`,
    });
  }

  // 4. Kiểm tra Cầm tay
  const handCheck = newRule.accessoryHands[currentOutfit.accessoryHand];
  if (handCheck && handCheck.isCompatible) {
    const meta = ACCESSORY_HAND_OPTIONS.find((h) => h.id === currentOutfit.accessoryHand);
    retainedItems.push({
      slotName: 'Cầm tay',
      label: meta?.name || currentOutfit.accessoryHand,
    });
  } else {
    const prevMeta = ACCESSORY_HAND_OPTIONS.find((h) => h.id === currentOutfit.accessoryHand);
    const newHand = newRule.defaultLayers.accessoryHand;
    const nextMeta = ACCESSORY_HAND_OPTIONS.find((h) => h.id === newHand);
    nextOutfit.accessoryHand = newHand;
    changedItems.push({
      slotName: 'Cầm tay',
      fromLabel: prevMeta?.name || currentOutfit.accessoryHand,
      toLabel: nextMeta?.name || newHand,
      reason: handCheck?.reason || `Gợi ý phù hợp với ${newRule.garmentName}`,
    });
  }

  const hasAutoChanged = changedItems.length > 0;
  let summaryMessage = `Đã chuyển sang ${newRule.garmentName}.`;
  if (hasAutoChanged) {
    summaryMessage = `Đã chuyển sang ${newRule.garmentName} và tự động điều chỉnh ${changedItems.length} lớp chưa tương thích.`;
  }

  return {
    nextOutfit,
    hasAutoChanged,
    changedItems,
    retainedItems,
    summaryMessage,
  };
}
