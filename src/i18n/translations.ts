export const en = {
  common: {
    appName: 'oh-we you!',
    save: 'Save',
    cancel: 'Cancel',
    add: 'Add',
    delete: 'Delete',
    edit: 'Edit',
    confirm: 'Confirm',
    loading: 'Loading…',
    back: 'Back',
    copy: 'Copy',
    copied: 'Copied!',
    done: 'Done',
    close: 'Close',
    retry: 'Retry',
    somethingWentWrong: 'Something went wrong.',
  },
  auth: {
    signInTitle: 'oh-we you!',
    signInSubtitle: 'Sign in to see your groups and keep them in sync across devices.',
    signInWithGoogle: 'Continue with Google',
    signingIn: 'Signing in…',
    signOut: 'Sign out',
    account: 'Account',
  },
  onboarding: {
    title: "What's your name?",
    subtitle: "This is how other members will see you in your groups.",
    namePlaceholder: 'e.g. yeji',
    submit: 'Continue',
    submitting: 'Saving…',
  },
  home: {
    title: 'oh-we you!',
    subtitle: 'Split shared expenses with your roommates, without the mental math.',
    yourGroups: 'Your groups',
    noGroups: "You're not in any groups yet.",
    createGroup: 'Create a group',
    joinGroup: 'Join with an invite link',
    joinGroupPlaceholder: 'Paste an invite link or code',
    joinGroupSubmit: 'Join',
    iosInstallTitle: 'Add oh-we you! to your Home Screen',
    iosInstallBody: 'Tap the Share icon (□↑) in Safari\'s toolbar, then "Add to Home Screen".',
    iosInstallDismiss: 'Dismiss',
  },
  createGroup: {
    title: 'Create a group',
    nameLabel: 'Group name',
    namePlaceholder: 'e.g. Apt 4B',
    currencyLabel: 'Currency',
    joiningAsLabel: 'Creating as {name}',
    submit: 'Create group',
    submitting: 'Creating…',
  },
  joinGroup: {
    title: 'Join {groupName}',
    invalidCode: "This invite link isn't valid. Ask for a fresh one.",
    memberCount: '{count} member already here|{count} members already here',
    joiningAsLabel: 'Joining as {name}',
    claimPrompt: 'Is one of these already you?',
    claimNoneOption: "No, I'm a new member",
    submit: 'Join group',
    submitting: 'Joining…',
  },
  dashboard: {
    balancesTitle: 'Balances',
    allSettledUp: "You're all settled up.",
    oneOnOne: '{from} owes {to}',
    addExpense: 'Add expense',
    recentExpenses: 'Recent expenses',
    viewAll: 'View all',
    noExpenses: 'No expenses yet — add the first one.',
    markSettled: 'Mark settled',
  },
  expense: {
    title: 'Add expense',
    editTitle: 'Edit expense',
    description: 'What was it for?',
    descriptionPlaceholder: 'e.g. Groceries',
    amount: 'Amount',
    category: 'Category',
    paidBy: 'Paid by',
    date: 'Date',
    splitType: 'Split',
    splitEqual: 'Equally',
    splitAmount: 'Custom amounts',
    splitPercent: 'Custom percentages',
    participants: 'Who shares this?',
    shareRemaining: '{amount} left to assign',
    shareOverAssigned: '{amount} over the total',
    submit: 'Add expense',
    submitting: 'Adding…',
    saveChanges: 'Save changes',
    saving: 'Saving…',
    selectAtLeastOne: 'Select at least one person.',
    addMemberToggle: "Add someone who hasn't joined yet",
    addMemberPlaceholder: 'Their name',
    addMemberSubmit: 'Add',
    note: 'Note (optional)',
    notePlaceholder: 'Any extra detail worth remembering',
    lockedNotice: 'This expense has already been settled and can no longer be edited.',
    deleteConfirmTitle: 'Delete this expense?',
    deleteConfirmBody: '"{description}" will move to the deleted list in History. This can\'t be undone from the app.',
    deleting: 'Deleting…',
  },
  history: {
    title: 'History',
    filterAllCategories: 'All categories',
    filterAllTime: 'All time',
    filterThisMonth: 'This month',
    noResults: 'No expenses match these filters.',
    paidByLine: '{name} paid · {category}',
    settledLine: '{from} paid {to}',
    loggedByLine: 'Logged by {name}',
    tabActive: 'History',
    tabDeleted: 'Deleted',
    deletedNoResults: 'No deleted expenses.',
    deletedByLine: 'Deleted by {name} · {date}',
  },
  members: {
    title: 'Members',
    you: 'you',
    pendingBadge: 'pending invite',
    removePlaceholder: 'Remove',
    addPlaceholder: 'Add a member who hasn\'t joined yet',
    placeholderNamePlaceholder: "Their name",
    addPlaceholderSubmit: 'Add',
    inviteLink: 'Invite link',
    inviteHint: 'Anyone with this link can join the group by entering their name.',
    copyLink: 'Copy link',
  },
  settlement: {
    title: 'Mark settled',
    amountLabel: 'Amount',
    note: 'Note (optional)',
    notePlaceholder: 'e.g. Paid by e-transfer',
    confirm: 'Mark as settled',
    confirming: 'Saving…',
    recorded: 'Settlement recorded outside the app — this just clears the balance here.',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    categories: 'Categories',
    addCategory: 'Add category',
    categoryNamePlaceholder: 'Category name',
    deleteCategory: 'Delete',
    categoryInUse: "Can't delete — still used by some expenses.",
    dangerZone: 'Danger zone',
    deleteGroup: 'Delete group',
    deletingGroup: 'Deleting…',
    deleteGroupConfirmTitle: 'Delete this group?',
    deleteGroupConfirmBody:
      'Nothing is actually deleted — expenses and history stay in the database — but no one, including you, will be able to access "{name}" from the app again.',
    notifications: 'Notifications',
    notificationsHint: 'Get a push notification when someone in this group adds an expense.',
    notificationsEnable: 'Turn on notifications',
    notificationsDisable: 'Turn off notifications',
    notificationsEnabling: 'Turning on…',
    notificationsDisabling: 'Turning off…',
    notificationsUnsupported: "This browser doesn't support push notifications.",
    notificationsDenied: 'Notifications are blocked for this site — enable them in your browser settings.',
    notificationsError: "Couldn't turn on notifications. Try again.",
    nickname: 'Nickname',
    nicknamePlaceholder: 'Your name',
    nicknameSaving: 'Saving…',
  },
  nav: {
    groups: 'Groups',
    dashboard: 'Dashboard',
    history: 'History',
    members: 'Members',
    settings: 'Settings',
  },
  category: {
    groceries: 'Groceries',
    cleaning: 'Cleaning Supplies',
    household: 'Household',
    other: 'Other',
  },
} satisfies Dictionary

// The `en` object above is the source of truth for available keys; every
// other language must implement exactly the same shape.
export type Dictionary = {
  common: {
    appName: string
    save: string
    cancel: string
    add: string
    delete: string
    edit: string
    confirm: string
    loading: string
    back: string
    copy: string
    copied: string
    done: string
    close: string
    retry: string
    somethingWentWrong: string
  }
  auth: {
    signInTitle: string
    signInSubtitle: string
    signInWithGoogle: string
    signingIn: string
    signOut: string
    account: string
  }
  onboarding: {
    title: string
    subtitle: string
    namePlaceholder: string
    submit: string
    submitting: string
  }
  home: {
    title: string
    subtitle: string
    yourGroups: string
    noGroups: string
    createGroup: string
    joinGroup: string
    joinGroupPlaceholder: string
    joinGroupSubmit: string
    iosInstallTitle: string
    iosInstallBody: string
    iosInstallDismiss: string
  }
  createGroup: {
    title: string
    nameLabel: string
    namePlaceholder: string
    currencyLabel: string
    joiningAsLabel: string
    submit: string
    submitting: string
  }
  joinGroup: {
    title: string
    invalidCode: string
    memberCount: string
    joiningAsLabel: string
    claimPrompt: string
    claimNoneOption: string
    submit: string
    submitting: string
  }
  dashboard: {
    balancesTitle: string
    allSettledUp: string
    oneOnOne: string
    addExpense: string
    recentExpenses: string
    viewAll: string
    noExpenses: string
    markSettled: string
  }
  expense: {
    title: string
    editTitle: string
    description: string
    descriptionPlaceholder: string
    amount: string
    category: string
    paidBy: string
    date: string
    splitType: string
    splitEqual: string
    splitAmount: string
    splitPercent: string
    participants: string
    shareRemaining: string
    shareOverAssigned: string
    submit: string
    submitting: string
    saveChanges: string
    saving: string
    selectAtLeastOne: string
    addMemberToggle: string
    addMemberPlaceholder: string
    addMemberSubmit: string
    note: string
    notePlaceholder: string
    lockedNotice: string
    deleteConfirmTitle: string
    deleteConfirmBody: string
    deleting: string
  }
  history: {
    title: string
    filterAllCategories: string
    filterAllTime: string
    filterThisMonth: string
    noResults: string
    paidByLine: string
    settledLine: string
    loggedByLine: string
    tabActive: string
    tabDeleted: string
    deletedNoResults: string
    deletedByLine: string
  }
  members: {
    title: string
    you: string
    pendingBadge: string
    removePlaceholder: string
    addPlaceholder: string
    placeholderNamePlaceholder: string
    addPlaceholderSubmit: string
    inviteLink: string
    inviteHint: string
    copyLink: string
  }
  settlement: {
    title: string
    amountLabel: string
    note: string
    notePlaceholder: string
    confirm: string
    confirming: string
    recorded: string
  }
  settings: {
    title: string
    language: string
    categories: string
    addCategory: string
    categoryNamePlaceholder: string
    deleteCategory: string
    categoryInUse: string
    dangerZone: string
    deleteGroup: string
    deletingGroup: string
    deleteGroupConfirmTitle: string
    deleteGroupConfirmBody: string
    notifications: string
    notificationsHint: string
    notificationsEnable: string
    notificationsDisable: string
    notificationsEnabling: string
    notificationsDisabling: string
    notificationsUnsupported: string
    notificationsDenied: string
    notificationsError: string
    nickname: string
    nicknamePlaceholder: string
    nicknameSaving: string
  }
  nav: {
    groups: string
    dashboard: string
    history: string
    members: string
    settings: string
  }
  category: {
    groceries: string
    cleaning: string
    household: string
    other: string
  }
}

export const ko: Dictionary = {
  common: {
    appName: 'oh-we you!',
    save: '저장',
    cancel: '취소',
    add: '추가',
    delete: '삭제',
    edit: '수정',
    confirm: '확인',
    loading: '불러오는 중…',
    back: '뒤로',
    copy: '복사',
    copied: '복사되었습니다!',
    done: '완료',
    close: '닫기',
    retry: '다시 시도',
    somethingWentWrong: '문제가 발생했습니다.',
  },
  auth: {
    signInTitle: 'oh-we you!',
    signInSubtitle: '로그인하면 내 그룹을 여러 기기에서 동일하게 볼 수 있어요.',
    signInWithGoogle: 'Google로 계속하기',
    signingIn: '로그인하는 중…',
    signOut: '로그아웃',
    account: '계정',
  },
  onboarding: {
    title: '이름을 알려주세요',
    subtitle: '그룹 멤버들에게 이 이름으로 보여요.',
    namePlaceholder: '예: 지혜',
    submit: '계속',
    submitting: '저장하는 중…',
  },
  home: {
    title: 'oh-we you!',
    subtitle: '룸메이트와 지출을 나누고, 암산은 이제 그만.',
    yourGroups: '내 그룹',
    noGroups: '아직 참여한 그룹이 없어요.',
    createGroup: '그룹 만들기',
    joinGroup: '초대 링크로 참여',
    joinGroupPlaceholder: '초대 링크 또는 코드를 붙여넣으세요',
    joinGroupSubmit: '참여하기',
    iosInstallTitle: '홈 화면에 oh-we you! 추가하기',
    iosInstallBody: 'Safari 하단 공유 아이콘(□↑)을 누른 다음 "홈 화면에 추가"를 선택하세요.',
    iosInstallDismiss: '닫기',
  },
  createGroup: {
    title: '그룹 만들기',
    nameLabel: '그룹 이름',
    namePlaceholder: '예: 4B호',
    currencyLabel: '통화',
    joiningAsLabel: '{name} 이름으로 생성',
    submit: '그룹 만들기',
    submitting: '만드는 중…',
  },
  joinGroup: {
    title: '{groupName} 참여하기',
    invalidCode: '유효하지 않은 초대 링크예요. 새 링크를 요청해주세요.',
    memberCount: '이미 {count}명이 참여 중',
    joiningAsLabel: '{name} 이름으로 참여',
    claimPrompt: '이 중에 이미 본인이 있나요?',
    claimNoneOption: '아니요, 새 멤버로 참여할게요',
    submit: '그룹 참여하기',
    submitting: '참여하는 중…',
  },
  dashboard: {
    balancesTitle: '정산 현황',
    allSettledUp: '모두 정산 완료됐어요.',
    oneOnOne: '{from}가 {to}에게',
    addExpense: '지출 추가',
    recentExpenses: '최근 지출',
    viewAll: '전체 보기',
    noExpenses: '아직 지출 내역이 없어요. 첫 지출을 추가해보세요.',
    markSettled: '정산 완료 처리',
  },
  expense: {
    title: '지출 추가',
    editTitle: '지출 수정',
    description: '무엇을 위한 지출인가요?',
    descriptionPlaceholder: '예: 장보기',
    amount: '금액',
    category: '카테고리',
    paidBy: '결제한 사람',
    date: '날짜',
    splitType: '분담 방식',
    splitEqual: '균등하게',
    splitAmount: '금액 직접 지정',
    splitPercent: '비율 직접 지정',
    participants: '누가 분담하나요?',
    shareRemaining: '{amount} 더 배분해야 해요',
    shareOverAssigned: '총액보다 {amount} 초과했어요',
    submit: '지출 추가',
    submitting: '추가하는 중…',
    saveChanges: '변경사항 저장',
    saving: '저장하는 중…',
    selectAtLeastOne: '한 명 이상 선택해주세요.',
    addMemberToggle: '아직 참여 전인 사람 추가',
    addMemberPlaceholder: '이름',
    addMemberSubmit: '추가',
    note: '비고 (선택)',
    notePlaceholder: '기억해두면 좋을 추가 정보',
    lockedNotice: '이미 정산이 완료된 지출이라 더 이상 수정할 수 없어요.',
    deleteConfirmTitle: '이 지출을 삭제할까요?',
    deleteConfirmBody: '"{description}" 항목이 내역의 삭제됨 목록으로 이동해요. 앱에서 되돌릴 수 없어요.',
    deleting: '삭제하는 중…',
  },
  history: {
    title: '지출 내역',
    filterAllCategories: '모든 카테고리',
    filterAllTime: '전체 기간',
    filterThisMonth: '이번 달',
    noResults: '조건에 맞는 지출이 없어요.',
    paidByLine: '{name} 결제 · {category}',
    settledLine: '{from} → {to} 정산 완료',
    loggedByLine: '기록: {name}',
    tabActive: '지출 내역',
    tabDeleted: '삭제됨',
    deletedNoResults: '삭제된 지출이 없어요.',
    deletedByLine: '{name}님이 삭제 · {date}',
  },
  members: {
    title: '멤버',
    you: '나',
    pendingBadge: '초대 대기중',
    removePlaceholder: '삭제',
    addPlaceholder: '아직 참여 전인 멤버 추가',
    placeholderNamePlaceholder: '이름',
    addPlaceholderSubmit: '추가',
    inviteLink: '초대 링크',
    inviteHint: '이 링크로 들어오면 이름만 입력하고 그룹에 참여할 수 있어요.',
    copyLink: '링크 복사',
  },
  settlement: {
    title: '정산 완료 처리',
    amountLabel: '금액',
    note: '메모 (선택)',
    notePlaceholder: '예: 계좌이체로 송금함',
    confirm: '정산 완료로 표시',
    confirming: '저장하는 중…',
    recorded: '실제 송금은 앱 밖에서 이루어져요 — 여기서는 잔액만 청산 처리해요.',
  },
  settings: {
    title: '설정',
    language: '언어',
    categories: '카테고리',
    addCategory: '카테고리 추가',
    categoryNamePlaceholder: '카테고리 이름',
    deleteCategory: '삭제',
    categoryInUse: '이미 사용 중인 카테고리라 삭제할 수 없어요.',
    dangerZone: '위험 구역',
    deleteGroup: '그룹 삭제',
    deletingGroup: '삭제하는 중…',
    deleteGroupConfirmTitle: '이 그룹을 삭제할까요?',
    deleteGroupConfirmBody:
      '실제로 데이터가 지워지지는 않아요 — 지출·정산 기록은 DB에 그대로 남습니다 — 다만 앞으로는 본인을 포함해 아무도 "{name}"에 접근할 수 없게 돼요.',
    notifications: '알림',
    notificationsHint: '이 그룹에 새 지출이 추가되면 푸시 알림을 받아요.',
    notificationsEnable: '알림 켜기',
    notificationsDisable: '알림 끄기',
    notificationsEnabling: '켜는 중…',
    notificationsDisabling: '끄는 중…',
    notificationsUnsupported: '이 브라우저는 푸시 알림을 지원하지 않아요.',
    notificationsDenied: '이 사이트의 알림이 차단되어 있어요 — 브라우저 설정에서 허용해주세요.',
    notificationsError: '알림을 켜지 못했어요. 다시 시도해주세요.',
    nickname: '닉네임',
    nicknamePlaceholder: '이름',
    nicknameSaving: '저장하는 중…',
  },
  nav: {
    groups: '그룹',
    dashboard: '대시보드',
    history: '내역',
    members: '멤버',
    settings: '설정',
  },
  category: {
    groceries: '식료품',
    cleaning: '청소용품',
    household: '생활용품',
    other: '기타',
  },
}
