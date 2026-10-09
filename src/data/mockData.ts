import { GarmentItem, LookbookCard, CulturalArticle, ColorPresetItem, GarmentCategoryMeta } from '../types';

export const HERO_ASSETS = {
  heroBanner: '/src/assets/images/mach_viet_hero_1791549541458.jpg',
  aoNguThan: '/src/assets/images/ao_ngu_than_exhibit_1791549551532.jpg',
  aoNhatBinh: '/src/assets/images/ao_nhat_binh_exhibit_1791549562498.jpg',
};

export const STUDIO_COLOR_PRESETS: ColorPresetItem[] = [
  { name: 'Xanh lục bảo', hex: '#1B4D3E', note: 'Thanh nhã, điềm tĩnh' },
  { name: 'Đỏ chu sa', hex: '#8B2626', note: 'May mắn, truyền thống' },
  { name: 'Vàng hoàng yến', hex: '#D4A054', note: 'Rực rỡ, quyền quý' },
  { name: 'Xanh chàm cổ', hex: '#2C3E50', note: 'Trầm tĩnh, học thức' },
  { name: 'Trắng bạch ngọc', hex: '#EAE6DF', note: 'Thuần khiết, giản dị' },
  { name: 'Tím hoa cà', hex: '#5E3A5A', note: 'Dịu dàng, hoài niệm' },
];

export const ACCESSORY_OPTIONS = [
  'Khăn đóng xếp nếp',
  'Khăn vấn lụa',
  'Quạt nan lụa thêu',
  'Túi gấm truyền thống',
  'Túi tote canvas mộc',
  'Giày Oxford / Derby cổ điển',
  'Sneaker trắng tối giản',
  'Guốc mộc truyền thống',
  'Trâm cài tóc hoa sen / ngọc',
];

export const CULTURAL_BOUNDARY_PRESETS = [
  'Tránh trang phục quá bó sát cơ thể',
  'Tránh màu sắc dạ quang / quá chói',
  'Tránh phối đồ nặng nề, khó vận động',
  'Không đội khăn lên đầu (ưu tiên tóc tự nhiên)',
  'Không mang trang sức cầu kỳ',
];

/**
 * Danh mục 4 nhóm y phục chuẩn mực dùng chung giữa Khám phá, Hồ sơ và Studio
 */
export const SHARED_GARMENT_CATEGORIES: GarmentCategoryMeta[] = [
  {
    id: 'ao_dai',
    name: 'Áo Dài (Hiện Đại / Tân Thời)',
    subTitle: 'Hai tà dài buông thả mặc cùng quần lụa',
    description: 'Trang phục biểu trưng với hai tà dài trước sau mặc cùng quần lụa, phản ánh tiến trình biến đổi của y phục truyền thống qua thế kỷ 20.',
    tag: 'Thanh lịch & Duyên dáng',
  },
  {
    id: 'ao_tu_than',
    name: 'Áo Tứ Thân',
    subTitle: 'Bốn vạt dài, yếm đào, thắt lưng lụa Bắc Bộ',
    description: 'Trang phục bốn vạt áo dài gắn liền với phụ nữ lao động Bắc Bộ, phối nhiều tầng lớp cùng áo yếm, thắt lưng lụa và nón quai thao.',
    tag: 'Mộc mạc & Dân gian',
  },
  {
    id: 'ao_ngu_than',
    name: 'Áo Ngũ Thân',
    subTitle: 'Năm thân cài khuy hữu nhậm, cổ lập lĩnh',
    description: 'Cấu tạo 5 thân ghép khổ vải, cúc cài bên nách phải; gồm cả dòng tay chẽn gọn gàng và áo tấc tay thụng trang trọng thời Nguyễn.',
    tag: 'Phổ biến & Chuẩn mực',
    subVariants: [
      {
        id: 'ngu-than-tay-chen',
        name: 'Ngũ thân tay chẽn',
        description: 'Ống tay may bó gọn từ khuỷu đến cổ tay, thuận tiện cho việc học tập, di chuyển năng động.'
      },
      {
        id: 'ao-tac-ngu-than-tay-thung',
        name: 'Áo tấc (Ngũ thân tay thụng)',
        description: 'Ống tay may thụng to bản buông rủ dài, là lễ phục cổ truyền trang trọng trong các nghi lễ lớn.'
      }
    ]
  },
  {
    id: 'ao_nhat_binh',
    name: 'Áo Nhật Bình',
    subTitle: 'Nẹp cổ hình chữ nhật trước ngực, viền tay ngũ hành',
    description: 'Thường phục cao cấp của phụ nữ hoàng tộc và mệnh phụ triều Nguyễn với nẹp cổ to bản tạo thành hình chữ nhật đặc trưng trước ngực.',
    tag: 'Ấn tượng & Quý phái',
  },
];



export const GARMENTS_DATA: GarmentItem[] = [
  {
    id: 'ao-dai-hien-dai',
    name: 'Áo Dài Hiện Đại (Tân Thời)',
    subName: 'Y phục biểu trưng với hai tà áo thướt tha',
    category: 'ao_dai',
    originEra: 'Thế kỷ 20 (chuyển hóa từ áo ngũ thân qua các đợt cách tân nghệ thuật)',
    image: HERO_ASSETS.heroBanner,
    imageNote: 'Ảnh minh họa thị giác đương đại (chưa qua giám định phục dựng bảo tàng)',
    shortDescription: 'Trang phục quen thuộc với hai tà dài trước sau mặc cùng quần lụa, phản ánh tiến trình thích ứng liên tục của người Việt với lối sống mới.',
    keyIdentificationFeatures: [
      'Hai tà áo dài thướt tha buông rủ ở thân trước và thân sau',
      'Mặc kết hợp cùng quần dài ống suông (lụa trắng, đen hoặc tiệp màu áo)',
      'Thân áo ôm nhẹ vừa vặn cơ thể, xẻ tà hai bên hông tạo sự mềm mại',
      'Cổ áo đa dạng: cổ đứng cao truyền thống, cổ tròn, cổ thuyền hoặc không cổ'
    ],
    silhouette: 'Hai tà dài buông thả mềm mại, đường xẻ tà cao ở eo mặc cùng quần dài ống rộng.',
    historicalContext: 'Áo dài hiện đại có cội nguồn trực tiếp từ áo ngũ thân truyền thống thế kỷ 18–19. Đầu thế kỷ 20, các họa sĩ trường Mỹ thuật Đông Dương như Cát Tường (áo Le Mur), Lê Phổ đã đưa yếu tố hội họa phương Tây vào cải cách phom dáng, tiếp sau đó là cải tiến tay áo raglan của nhà may Dung Đakao (thập niên 1960). Áo dài là ví dụ điển hình về sự kế thừa và chuyển hóa văn hóa.',
    idealOccasions: [
      'Đồng phục học đường / sinh viên (gợi ý tham khảo)',
      'Chụp ảnh kỷ yếu tốt nghiệp (gợi ý tham khảo)',
      'Lễ Tết truyền thống & du xuân (gợi ý tham khảo)',
      'Nghi lễ trang trọng & ngày hội văn hóa (gợi ý tham khảo)'
    ],
    modernStylingTip: 'Phối cùng giày cao gót thanh mảnh, sandal quai mảnh hoặc giày búp bê tối giản; có thể điểm xuyết thêm kẹp tóc lụa hoặc túi xách nhỏ thanh lịch.',
    structure: [
      {
        name: 'Hai tà áo trước và sau',
        description: 'Tà áo dài cắt cong nhẹ ở gấu, xẻ dọc từ eo xuống giúp bước đi nhẹ nhàng, bay bổng.'
      },
      {
        name: 'Cổ áo (Cổ đứng / Cổ tròn)',
        description: 'Cổ đứng cao từ 2-4cm ôm nhẹ cổ, hoặc cổ tròn hạ thấp thoáng mát cho các bạn học sinh.'
      },
      {
        name: 'Khuy bấm / Dây kéo sau',
        description: 'Khuy bấm bên sườn hoặc dây kéo sau lưng thuận tiện cho việc mặc hàng ngày.'
      },
      {
        name: 'Quần lụa ống suông',
        description: 'Quần may bằng lụa phi bóng hoặc gấm nhẹ, ống suông rộng chấm mu bàn chân.'
      }
    ],
    references: [
      {
        title: 'The Story of the Ao Dai',
        authorOrOrg: 'Vietnam National Administration of Tourism (Cục Du lịch Quốc gia Việt Nam)',
        url: 'https://vietnam.travel/node/1216',
        note: 'Bài viết tổng quan về tiến trình phát triển và các đợt cách tân của tà áo dài trong dòng chảy lịch sử văn hóa.',
        status: 'verified_source'
      }
    ],
    colorPalette: [
      { name: 'Trắng tinh khôi', hex: '#FAF7F2' },
      { name: 'Đỏ thắm', hex: '#8B2626' },
      { name: 'Hồng phấn', hex: '#D98282' },
      { name: 'Xanh ngọc bích', hex: '#2A7B68' }
    ],
    isFeatured: true
  },
  {
    id: 'ngu-than-tay-chen',
    name: 'Áo Ngũ Thân Tay Chẽn',
    subName: 'Việt phục thường nhật & thanh lịch thời Nguyễn',
    category: 'ao_ngu_than',
    originEra: 'Thời chúa Nguyễn Phúc Khoát (1744) & chuẩn hóa thời vua Minh Mạng (1827–1837)',
    image: HERO_ASSETS.aoNguThan,
    imageNote: 'Ảnh minh họa thể nghiệm thị giác (chưa qua giám định phục dựng bảo tàng)',
    shortDescription: 'Áo dài truyền thống gồm 5 thân vải với ống tay may ôm gọn gàng, khuy cài lệch bên phải (hữu nhậm), toát lên phong thái đĩnh đạc.',
    keyIdentificationFeatures: [
      'Cấu tạo đúng 5 thân vải: 2 thân trước, 2 thân sau và 1 thân con (tiểu bồi) nằm kín phía trong',
      'Cổ lập lĩnh (cổ đứng) thẳng đứng ôm trọn cổ, cao khoảng 2.5–4cm',
      'Hệ thống 5 cúc (khuy) cài lệch từ cổ sang nách và dọc mạn sườn phải (hữu nhậm)',
      'Ống tay may bó gọn từ khủyu tay tới cổ tay, thuận tiện cho cử động học tập'
    ],
    silhouette: 'Phom đứng thẳng, đường lượn tà hình cánh cung uyển chuyển, tay áo ôm gọn.',
    historicalContext: 'Áo ngũ thân được định hình sau sắc lệnh canh tân trang phục năm 1744 của chúa Nguyễn Phúc Khoát tại Đàng Trong và tiếp tục được vua Minh Mạng chuẩn hóa trên phạm vi toàn quốc vào các năm 1827–1837. Các diễn giải dân gian thường gắn 5 thân áo với tứ thân phụ mẫu và chính bản thân, cùng 5 hạt cúc với ngũ thường (Nhân, Lễ, Nghĩa, Trí, Tín). Tuy nhiên, các nhà nghiên cứu lưu ý các ý nghĩa đạo lý này cần tiếp tục được đối chiếu thêm với các văn bản thành văn triều đình.',
    historicalCaution: 'Lưu ý học thuật: Việc giải nghĩa 5 cúc tượng trưng cho Ngũ Thường là quan niệm truyền khẩu văn hóa sâu sắc, việc đối chiếu quy chuẩn kỹ thuật đo may cụ thể vẫn đang được các học giả tiếp tục khảo cứu từ thư tịch.',
    idealOccasions: [
      'Chụp kỷ yếu tốt nghiệp phong cách cổ phong (gợi ý tham khảo)',
      'Dạo phố cuối tuần & chụp ảnh văn hóa (gợi ý tham khảo)',
      'Thuyết trình đề tài văn hóa trường học (gợi ý tham khảo)',
      'Lễ hội truyền thống địa phương (gợi ý tham khảo)'
    ],
    modernStylingTip: 'Rất hợp mặc cùng quần lụa trắng hoặc đen; có thể mang giày da Derby/Oxford hoặc sneaker trắng đế bệt tối giản để giữ nét thanh lịch hiện đại mà không làm gãy phom tà.',
    structure: [
      {
        name: 'Năm thân áo (Ngũ thân)',
        description: '2 thân trước, 2 thân sau ghép sống lưng giữa, và 1 thân con (tiểu bồi) lót kín đáo bên trong.',
        significance: 'Dân gian quan niệm tượng trưng cho cha mẹ hai bên ôm ấp chở che người mặc.'
      },
      {
        name: 'Hệ 5 cúc khuy ngọc/đồng',
        description: '5 cúc cài lệch từ cổ qua nách và xuống hông sườn phải.',
        significance: 'Quan niệm gắn với 5 đức tính Ngũ Thường: Nhân, Lễ, Nghĩa, Trí, Tín.'
      },
      {
        name: 'Cổ lập lĩnh (Cổ đứng)',
        description: 'Cổ đứng ôm vừa quanh cổ, vuông góc ngay ngắn, tạo nét tôn nghiêm nhã nhặn.'
      },
      {
        name: 'Ống tay chẽn ôm gọn',
        description: 'Phần ống tay ôm vừa vặn từ khuỷu đến cổ tay, giữ nét cơ động trẻ trung.'
      }
    ],
    references: [
      {
        title: 'Lễ trao tặng Áo dài ngũ thân truyền thống nhân Ngày Di sản Văn hóa Việt Nam',
        authorOrOrg: 'Sở Văn hóa và Thể thao TP. Hồ Chí Minh',
        url: 'https://svhtt.hochiminhcity.gov.vn/tin-chi-tiet/-/chi-tiet/le-trao-tang-ao-dai-ngu-than-truyen-thong-nhan-ngay-di-san-van-hoa-23-thang-11-23561-1002.html',
        note: 'Tư liệu ghi nhận các hoạt động bảo tồn, may phục hồi và lan tỏa áo dài ngũ thân truyền thống trong đời sống đương đại.',
        status: 'verified_source'
      },
      {
        title: 'Quy chế y phục thời Nguyễn (Khảo cứu thư tịch cổ)',
        authorOrOrg: 'Khâm Định Đại Nam Hội Điển Sự Lệ & Đại Nam Thực Lục',
        note: 'Nguồn tư liệu sử học chính thống; các quy định chi tiết về phẩm vị và chất liệu vải cần tham chiếu văn bản dịch học thuật.',
        status: 'needs_verification'
      }
    ],
    colorPalette: [
      { name: 'Xanh lục bảo', hex: '#1B4D3E' },
      { name: 'Đỏ chu sa', hex: '#8B2626' },
      { name: 'Vàng hoa cúc', hex: '#D4A054' },
      { name: 'Chàm than', hex: '#2A3439' }
    ],
    isFeatured: true
  },
  {
    id: 'ao-tac-ngu-than-tay-thung',
    name: 'Áo Tấc (Ngũ Thân Tay Thụng)',
    subName: 'Lễ phục cổ truyền trang trọng thời Nguyễn',
    category: 'ao_ngu_than',
    originEra: 'Triều Nguyễn (Thế kỷ 19 - đầu thế kỷ 20)',
    imageNote: 'Bản vẽ mô phỏng dáng tay thụng (chưa qua kiểm định hiện vật bảo tàng)',
    shortDescription: 'Lễ phục trang trọng có cấu trúc năm thân tương tự tay chẽn nhưng ống tay may thụng to bản buông rủ dài, thường mặc trong các dịp đại lễ.',
    keyIdentificationFeatures: [
      'Cấu trúc 5 thân vải tương tự áo ngũ thân chẽn',
      'Ống tay may thụng to bản, rộng từ 30 đến 50cm, viền tay buông chùng trang nghiêm',
      'Khi khoanh tay trước ngực, hai tay áo giao nhau tạo phom khối vuông vức đĩnh đạc',
      'Thường đi liền với khăn đóng (nam) hoặc khăn vấn (nữ)'
    ],
    silhouette: 'Tà áo dài qua gối, ống tay thụng rộng buông rủ, phom áo suông rộng tạo phong thái đĩnh đạc khi bước đi.',
    historicalContext: 'Áo tấc là thường phục lễ nghi được quy định cho cả quan lại lẫn bình dân thời Nguyễn khi thực hiện các nghi thức cúng tế, đình đám, hôn lễ hoặc bái yết tôn nghiêm. Tên gọi "áo tấc" được một số nhà nghiên cứu giải thích là do phần viền ống tay may rộng chừng một tấc xưa, song cách giải thích này vẫn cần được đối chiếu thêm với các tài liệu văn bản gốc.',
    idealOccasions: [
      'Lễ tốt nghiệp đại học / nhận bằng (gợi ý tham khảo)',
      'Lễ Tết gia đình & dâng hương tổ tiên (gợi ý tham khảo)',
      'Đám cưới / Lễ vu quy truyền thống (gợi ý tham khảo)',
      'Sự kiện văn hóa trang trọng (gợi ý tham khảo)'
    ],
    modernStylingTip: 'Kết hợp cùng quần lụa trắng hoặc kem suông rộng; giữ tư thế đi đứng khoan thai, tránh đeo túi đeo chéo quá to làm gãy nếp tay thụng.',
    structure: [
      {
        name: 'Ống tay thụng rộng (Tay tấc)',
        description: 'Tay áo buông dài bằng hoặc qua gấu áo, tạo vẻ uy nghi khi khoanh tay làm lễ.'
      },
      {
        name: 'Thân áo năm tà',
        description: 'Phom áo suông rộng vừa phải, tà áo dài quá gối, vạt cong hình cánh cung.'
      },
      {
        name: 'Khăn vấn / Khăn đóng',
        description: 'Nam đội khăn đóng chữ Nhân hoặc chữ Nhất, nữ đội khăn vấn nhung hoặc vấn tết tóc.'
      }
    ],
    references: [
      {
        title: 'Lễ trao tặng Áo dài ngũ thân truyền thống nhân Ngày Di sản Văn hóa Việt Nam',
        authorOrOrg: 'Sở Văn hóa và Thể thao TP. Hồ Chí Minh',
        url: 'https://svhtt.hochiminhcity.gov.vn/tin-chi-tiet/-/chi-tiet/le-trao-tang-ao-dai-ngu-than-truyen-thong-nhan-ngay-di-san-van-hoa-23-thang-11-23561-1002.html',
        note: 'Đề cập đến vai trò của áo tấc (ngũ thân tay thụng) trong kho tàng lễ phục truyền thống.',
        status: 'verified_source'
      },
      {
        title: 'Tập quán lễ nghi gia tộc và trang phục triều Nguyễn',
        authorOrOrg: 'Tư liệu nghiên cứu điền dã dân tộc học',
        note: 'Tài liệu ghi chép tập quán dân gian; cần đối chiếu thêm với bảo vật lưu giữ tại Bảo tàng Lịch sử Quốc gia.',
        status: 'needs_verification'
      }
    ],
    colorPalette: [
      { name: 'Đỏ huyết dụ', hex: '#7A1F26' },
      { name: 'Vàng hoàng yến', hex: '#CFA043' },
      { name: 'Xanh thiên thanh', hex: '#4A6B82' },
      { name: 'Trắng bạch ngọc', hex: '#EAE6DF' }
    ],
    isFeatured: true
  },
  {
    id: 'ao-nhat-binh',
    name: 'Áo Nhật Bình',
    subName: 'Thường phục hoàng tộc & mệnh phụ triều Nguyễn',
    category: 'ao_nhat_binh',
    originEra: 'Thời nhà Nguyễn (Từ thời vua Gia Long tới Bảo Đại)',
    image: HERO_ASSETS.aoNhatBinh,
    imageNote: 'Ảnh minh họa thể nghiệm thị giác (chưa qua giám định phục dựng bảo tàng - phân biệt rõ với nguồn gốc lịch sử triều đình)',
    shortDescription: 'Thường phục cao cấp của phụ nữ hoàng tộc triều Nguyễn với nẹp cổ to bản tạo thành hình chữ nhật đặc trưng trước ngực.',
    keyIdentificationFeatures: [
      'Nẹp cổ áo to bản tạo thành hình chữ nhật trước ngực (tên gọi "Nhật Bình")',
      'Hai vạt áo mở phía trước xẻ dọc, buộc dải lụa hoặc cài khuy kim loại chạm trổ',
      'Đầu ống tay áo có viền ngũ hành 5 dải màu: lục, vàng, lam (thanh), trắng (bạch), đỏ (xích)',
      'Khoác ngoài áo lót hoặc áo ngũ thân lụa mềm mại'
    ],
    silhouette: 'Dáng áo xẻ giữa buông thẳng, cổ nẹp chữ nhật nổi bật, tay áo buông rộng viền chỉ ngũ sắc.',
    historicalContext: 'Áo Nhật Bình được quy định chặt chẽ trong Khâm Định Đại Nam Hội Điển Sự Lệ, là thường phục của Hậu phi, Công chúa và Mệnh phụ quý tộc thời Nguyễn. Màu sắc vải chính, hoa văn thêu (phượng, loan, hoa lá) và chất liệu quy định nghiêm ngặt theo cấp bậc phẩm trật. Sau khi triều đại kết thúc, áo được các gia đình quyền quý miền Trung kế thừa làm áo cưới.',
    historicalCaution: 'LƯU Ý ĐẶC BIỆT: Hình ảnh minh họa hiện tại là mô hình thị giác dựng lại, KHÔNG PHẢI hình ảnh hiện vật bảo tàng gốc đã qua thẩm định niên đại khảo cổ. Không đồng nhất hình ảnh minh họa này với nguồn gốc lịch sử gốc trong thư tịch cổ.',
    idealOccasions: [
      'Chụp ảnh nghệ thuật chủ đề cổ phong cung đình (gợi ý tham khảo)',
      'Lễ cưới truyền thống miền Trung / phong cách hoàng gia (gợi ý tham khảo)',
      'Ngày hội di sản và triển lãm văn hóa sinh viên (gợi ý tham khảo)'
    ],
    modernStylingTip: 'Nên khoác bên ngoài một lớp áo dài hoặc áo tấc lụa trơn màu kem nhã nhặn; kết hợp quạt nan lụa thêu hoa sen hoặc trâm cài tóc thanh mảnh để tôn nẹp cổ chữ nhật.',
    structure: [
      {
        name: 'Nẹp cổ áo Nhật Bình',
        description: 'Bản nẹp hình chữ nhật chạy dọc trước ngực, thêu hoa văn đối xứng tỉ mỉ.'
      },
      {
        name: 'Dải viền ngũ hành tay áo',
        description: 'Đầu tay áo may viền 5 dải lụa ngũ sắc đại diện ngũ hành tương sinh.'
      },
      {
        name: 'Hai dải thắt thắt lưng / giải bội',
        description: 'Dải lụa thêu hoa văn thả dài phía trước tăng thêm nét uyển chuyển khi di chuyển.'
      }
    ],
    references: [
      {
        title: 'Khâm định Đại Nam hội điển sự lệ (Chương Lễ bộ - Y phục)',
        authorOrOrg: 'Nội các triều Nguyễn (Bản dịch của Viện Sử học)',
        note: 'Nguồn thư tịch chữ Hán nguyên bản quy chế phẩm phục của hoàng gia. Cần tiếp tục đối chiếu các bản dịch chuyên khảo.',
        status: 'needs_verification'
      },
      {
        title: 'Ghi chú nguồn hình ảnh minh họa',
        authorOrOrg: 'Tài liệu thiết kế dự án Mạch Việt',
        note: 'Hình ảnh dựng phục vụ trực quan hóa thị giác cho học sinh sinh viên, chưa phải hiện vật bảo vật quốc gia đã thẩm định.',
        status: 'unverified'
      }
    ],
    colorPalette: [
      { name: 'Đỏ xích', hex: '#9E2A2B' },
      { name: 'Tím hoa cà', hex: '#5E3A5A' },
      { name: 'Cam đất', hex: '#B85D36' },
      { name: 'Vàng hoàng cúc', hex: '#E0AA3E' }
    ],
    isFeatured: true
  },
  {
    id: 'ao-tu-than',
    name: 'Áo Tứ Thân',
    subName: 'Nét duyên mộc mạc châu thổ Bắc Bộ',
    category: 'ao_tu_than',
    originEra: 'Dân gian thế kỷ 18–19 (Vùng đồng bằng Bắc Bộ)',
    imageNote: 'Phác thảo thị giác trang phục dân gian (chưa có tài liệu thẩm định bảo tàng số hóa công khai)',
    shortDescription: 'Trang phục bốn vạt áo dài gắn liền với phụ nữ lao động Bắc Bộ, phối nhiều tầng lớp cùng áo yếm, thắt lưng lụa và nón quai thao.',
    keyIdentificationFeatures: [
      'Gồm bốn vạt áo dài: 2 vạt sau khâu liền thành sống lưng, 2 vạt trước buông tự do hoặc thắt vạt chéo ở eo',
      'Mặc lót bên trong một chiếc yếm (yếm đào, yếm nâu hoặc yếm cổ xây)',
      'Thắt lưng lụa bao ngoài giữ nếp áo và tạo điểm nhấn eo duyên dáng',
      'Thường phối cùng nón quai thao (nón ba tầm) và khăn mỏ quạ đội đầu'
    ],
    silhouette: 'Bốn vạt áo rủ mềm, thắt nút ngang eo duyên dáng, nhiều lớp lang màu sắc đan xen.',
    historicalContext: 'Áo tứ thân phản ánh điều kiện lao động và tập quán sinh hoạt của người phụ nữ nông nghiệp vùng đồng bằng sông Hồng. Thiết kế xẻ vạt trước cho phép buộc gọn gàng khi làm đồng hoặc thả bay bổng trong những ngày trẩy hội mùa xuân.',
    historicalCaution: 'TÌNH TRẠNG KIỂM CHỨNG HỌC THUẬT: Hiện tại các nguồn tư liệu số hóa công khai chính thức từ cơ quan quản lý di sản về thời điểm xuất hiện ban đầu của áo tứ thân vẫn còn hạn chế và cần tiếp tục được đối chiếu với các công trình dân tộc học chính thống.',
    idealOccasions: [
      'Biểu diễn dân ca quan họ & văn nghệ trường học (gợi ý tham khảo)',
      'Hội xuân & ngày hội trò chơi dân gian (gợi ý tham khảo)',
      'Chụp ảnh ngoại cảnh hoài niệm đồng quê (gợi ý tham khảo)'
    ],
    modernStylingTip: 'Có thể lấy cảm hứng từ cấu trúc phân lớp (áo yếm + áo khoác tà dài) để kết hợp với chân váy xòe hoặc quần lanh ống suông màu be trong các bộ ảnh phong cách nghệ thuật đương đại.',
    structure: [
      {
        name: 'Bốn thân áo (Tứ thân)',
        description: 'Hai vạt sau may sống liền, hai vạt trước để buông rủ hoặc buộc nút trước bụng.'
      },
      {
        name: 'Áo yếm lót trong',
        description: 'Yếm lụa hoặc vải thô che ngực hình quả trám với quai buộc cổ và lưng duyên dáng.'
      },
      {
        name: 'Thắt lưng lụa / Ruột tượng',
        description: 'Dải thắt lưng vải lụa xanh màu lá chuối hoặc hồng cánh sen thắt gọn ngang eo.'
      }
    ],
    references: [
      {
        title: 'Nghiên cứu về trang phục dân gian phụ nữ vùng châu thổ Bắc Bộ',
        authorOrOrg: 'Tài liệu Dân tộc học & Văn hóa dân gian (Chưa số hóa toàn văn)',
        note: 'Nguồn tư liệu giấy học thuật; hiện chưa có liên kết số hóa chính thức trên cổng thông tin nhà nước.',
        status: 'needs_verification'
      },
      {
        title: 'Ghi chú khảo sát văn hóa Mạch Việt',
        authorOrOrg: 'Ban biên tập Mạch Việt',
        note: 'Nội dung dựa trên miêu tả tập quán dân gian phổ biến, đang chờ đối chiếu hiện vật tại Bảo tàng Phụ nữ Việt Nam.',
        status: 'unverified'
      }
    ],
    colorPalette: [
      { name: 'Nâu sồng gụ', hex: '#4A3525' },
      { name: 'Hồng cánh sen', hex: '#C25975' },
      { name: 'Vàng mơ', hex: '#E6B86A' }
    ],
    isFeatured: true
  }
];

export const LOOKBOOK_SAMPLES: LookbookCard[] = [
  {
    id: 'lb-1',
    title: 'Kỷ Yếu Sân Trường Cổ Kính',
    concept: 'Nét thư sinh thanh lịch giữa hàng cây và giảng đường',
    occasion: 'Chụp kỷ yếu tốt nghiệp',
    primaryGarment: 'Áo Ngũ Thân Tay Chẽn (Xanh lục & Trắng ngà)',
    palette: ['#1B4D3E', '#FAF7F2', '#241E1C'],
    stylingItems: ['Áo ngũ thân chẽn', 'Quần lụa trắng', 'Giày Oxford da nâu', 'Khăn đóng xếp nếp'],
    author: 'CLB Cổ phục Đại học KHXH&NV',
    audience: 'Học sinh - Sinh viên'
  },
  {
    id: 'lb-2',
    title: 'Dạo Phố Tết Phố Cổ',
    concept: 'Ấm áp, rạng rỡ và tràn đầy sức sống mùa xuân',
    occasion: 'Dạo Tết Nguyên Đán',
    primaryGarment: 'Áo Tấc Ngũ Thân (Đỏ Huyết Dụ)',
    palette: ['#7A1F26', '#D4A054', '#FAF7F2'],
    stylingItems: ['Áo tấc đỏ', 'Quần lụa kem', 'Quạt nan lụa thêu sen', 'Túi gấm đeo chéo'],
    author: 'Nhóm Bạn Trẻ Mạch Việt',
    audience: 'Giới trẻ yêu phong cách retro'
  },
  {
    id: 'lb-3',
    title: 'Hội Ngộ Thư Quán',
    concept: 'Phong cách tối giản, hoài niệm mà gần gũi',
    occasion: 'Giao lưu văn học & Cà phê',
    primaryGarment: 'Áo Dài Hiện Đại (Trắng Tinh Khôi)',
    palette: ['#FAF7F2', '#2A7B68', '#241E1C'],
    stylingItems: ['Áo dài trắng', 'Quần lụa', 'Túi tote vải mộc', 'Kính gọng tròn'],
    author: 'Ban Biên Tập Mạch Việt',
    audience: 'Sinh viên'
  }
];

export const CULTURAL_ARTICLES: CulturalArticle[] = [
  {
    id: 'bai-1-ngu-than',
    title: 'Triết lý Áo Ngũ Thân: Khi chiếc áo là bài học làm người',
    subtitle: 'Vì sao áo có đúng 5 thân và 5 cúc cài?',
    summary: 'Áo ngũ thân không chỉ là trang phục giữ ấm hay che thân, mà là hiện thân của đạo hiếu và nhân cách sống của người Việt xưa.',
    keyTakeaway: '4 thân áo ngoài tượng trưng cho tứ thân phụ mẫu (cha mẹ ruột và cha mẹ vợ/chồng), thân con bên trong tượng trưng cho người mặc luôn được gia đình chở che. 5 cúc áo nhắc nhở về 5 đức tính Ngũ Thường: Nhân, Lễ, Nghĩa, Trí, Tín.',
    culturalDimension: 'Cấu trúc y phục & Đạo đức gia đình',
    etiquetteTip: 'Khi mặc áo ngũ thân, luôn cài đủ cả 5 cúc, chỉnh cổ áo ngay ngắn để toát lên phong thái chỉn chu, điềm đạm.'
  },
  {
    id: 'bai-2-quy-cach-huu-nham',
    title: 'Cổ lập lĩnh và quy cách khuy cài bên hữu',
    subtitle: 'Nét đặc trưng nhận diện trang phục Việt truyền thống',
    summary: 'Trang phục Việt Nam thời Nguyễn quy định cài khuy sang nách phải (Hữu nhậm), cổ đứng thẳng ôm trọn cổ (Lập lĩnh).',
    keyTakeaway: 'Hữu nhậm là quy cách văn minh lâu đời. Cổ lập lĩnh của áo dài ngũ thân là tiền thân trực tiếp của chiếc áo dài truyền thống mà chúng ta thấy ngày nay.',
    culturalDimension: 'Lịch sử phát triển trang phục',
    etiquetteTip: 'Cổ áo nên vừa vặn, không quá chật gây khó thở, nhưng cũng không hở quá rộng làm mất dáng áo cổ đứng.'
  },
  {
    id: 'bai-3-phoi-do-tre',
    title: 'Người trẻ phối Việt phục: Ranh giới giữa sáng tạo và tôn trọng',
    subtitle: 'Có nên mang sneaker hay đeo kính mát khi mặc cổ phục?',
    summary: 'Sự tiếp nối của người trẻ là cách di sản sống lại. Phối thêm phụ kiện hiện đại hoàn toàn khả thi nếu giữ vững phom cốt y phục.',
    keyTakeaway: 'Nguyên tắc vàng: Giữ nguyên cốt cách trang phục (phom cắt, đường may, cách cài khuy), có thể tự do biến tấu phụ kiện hiện đại (giày sneaker tối giản, đồng hồ cổ điển, túi canvas in họa tiết truyền thống). Tránh biến tướng phom dáng làm biến dạng ý nghĩa văn hóa.',
    culturalDimension: 'Văn hóa đương đại & Giới trẻ',
    etiquetteTip: 'Ưu tiên sneaker màu trơn (trắng/đen/kem), tránh giày thể thao hầm hố dạ quang quá chói làm lấn át vẻ trang nhã của tà áo.'
  }
];
